import os
import datetime
import pymysql
from dotenv import load_dotenv

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ==========================================
# [1] 환경 변수 로드 및 DB 설정
# ==========================================
# 폴더 구조에 맞게 backend 폴더의 .env 파일을 지정합니다.
dotenv_path = '../backend/.env' 
load_dotenv(dotenv_path)

DB_CONFIG = {
    'host': os.environ.get('DB_HOST'),
    'user': os.environ.get('DB_USER'),
    'password': os.environ.get('DB_PASS'), 
    'database': os.environ.get('DB_NAME'),
    'port': 3307,
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# ==========================================
# [2] KoELECTRA 모델 로드 및 세팅
# ==========================================
# 모델 파일들이 모여있는 폴더 경로 지정
MODEL_PATH = "./koelectra_model" 

print(f"[{datetime.datetime.now()}] KoELECTRA 모델을 불러오는 중입니다...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

# 추론 모드로 전환
model.eval()

def analyze_sentiment(text):
    """
    텍스트를 받아 모델을 통과시킨 후 최종 라벨과 각 감정 확률을 반환합니다.
    """
    inputs = tokenizer(
        text, 
        return_tensors='pt', 
        truncation=True, 
        padding=True, 
        max_length=128 
    )

    with torch.no_grad():
        outputs = model(**inputs)
    
    logits = outputs.logits
    probs = F.softmax(logits, dim=-1).squeeze().tolist()
    
    # config.json에 명시된 라벨 순서에 맞게 확률 매핑 (0: neutral, 1: negative, 2: positive)
    neu_prob = probs[0]
    neg_prob = probs[1]
    pos_prob = probs[2]
    
    # 가장 높은 확률을 가진 감정을 최종 라벨로 선택
    max_index = probs.index(max(probs))
    
    if max_index == 0:
        label = 'neutral'
    elif max_index == 1:
        label = 'negative'
    else:
        label = 'positive'
        
    return label, pos_prob, neg_prob, neu_prob


# ==========================================
# [3] 메인 배치 로직 (DB 연동 및 업데이트)
# ==========================================
def run_daily_batch():
    connection = pymysql.connect(**DB_CONFIG)
    
    try:
        with connection.cursor() as cursor:
            print(f"[{datetime.datetime.now()}] DB 연결 성공. 감정분석 배치 작업 시작...")
            
            # --- 1. 분석되지 않은 데이터 조회 ---
            fetch_sql = """
                SELECT ue.example_id, ue.content, ue.collected_date, ke.keyword_id
                FROM USAGE_EXAMPLE ue
                JOIN KEYWORD_EXAMPLE ke ON ue.example_id = ke.example_id
                WHERE ue.sentiment_label IS NULL;
            """
            cursor.execute(fetch_sql)
            unprocessed_data = cursor.fetchall()
            
            if not unprocessed_data:
                print("새로 분석할 댓글 데이터가 없습니다. 작업을 종료합니다.")
                return

            print(f"총 {len(unprocessed_data)}개의 분석 대상 데이터가 확인되었습니다. 분석을 시작합니다.")

            # --- 2. 업데이트용 데이터 변수 준비 ---
            usage_updates = []
            stats_agg = {}

            # --- 3. 모델 추론 및 점수 집계 ---
            for index, row in enumerate(unprocessed_data):
                example_id = row['example_id']
                content = row['content']
                keyword_id = row['keyword_id']
                stat_date = row['collected_date'] 
                
                # 모델 분석 실행
                label, pos_prob, neg_prob, neu_prob = analyze_sentiment(content)
                
                # USAGE_EXAMPLE 업데이트용 리스트에 추가
                usage_updates.append((label, example_id))
                
                # KEYWORD_STATS 통계 누적
                agg_key = (keyword_id, stat_date)
                if agg_key not in stats_agg:
                    stats_agg[agg_key] = {'pos': 0.0, 'neg': 0.0, 'neu': 0.0}
                
                stats_agg[agg_key]['pos'] += pos_prob
                stats_agg[agg_key]['neg'] += neg_prob
                stats_agg[agg_key]['neu'] += neu_prob
                
                # 진행 상황 출력 (500개마다)
                if (index + 1) % 500 == 0:
                    print(f"진행 중: {index + 1} / {len(unprocessed_data)} 개 완료")

            print("모든 텍스트 분석 완료. DB 업데이트를 시작합니다.")

            # --- 4. DB 일괄 업데이트 (Bulk Update) ---
            
            # 4-1. 개별 댓글 태그 업데이트
            update_usage_sql = """
                UPDATE USAGE_EXAMPLE 
                SET sentiment_label = %s 
                WHERE example_id = %s
            """
            cursor.executemany(update_usage_sql, usage_updates)
            print(f"✅ USAGE_EXAMPLE 테이블: {len(usage_updates)}건 태그 업데이트 완료.")

            # 4-2. 키워드별 통계 누적 업데이트
            update_stats_sql = """
                UPDATE KEYWORD_STATS
                SET positive_score = positive_score + %s,
                    negative_score = negative_score + %s,
                    neutral_score = neutral_score + %s
                WHERE keyword_id = %s AND stat_date = %s
            """
            stats_update_data = [
                (v['pos'], v['neg'], v['neu'], k[0], k[1]) 
                for k, v in stats_agg.items()
            ]
            
            cursor.executemany(update_stats_sql, stats_update_data)
            print(f"✅ KEYWORD_STATS 테이블: {len(stats_update_data)}개 그룹(키워드+날짜) 점수 업데이트 완료.")

        # 에러 없이 완료되면 커밋
        connection.commit()
        print(f"[{datetime.datetime.now()}] 모든 배치 작업이 성공적으로 완료되었습니다.")

    except Exception as e:
        connection.rollback()
        print(f"❌ 작업 중 에러가 발생하여 DB가 롤백되었습니다: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    run_daily_batch()
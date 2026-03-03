import os
import datetime
import pymysql
from dotenv import load_dotenv

import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# ==========================================
# [1] 환경 변수(.env) 로드 및 DB 설정
# ==========================================
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
MODEL_PATH = "./koelectra_model" 

print(f"[{datetime.datetime.now()}] KoELECTRA 모델을 불러오는 중입니다...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

def analyze_sentiment(text):
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
    
    max_index = probs.index(max(probs))
    
    if max_index == 0:
        label = 'neutral'
    elif max_index == 1:
        label = 'negative'
    else:
        label = 'positive'
        
    return label


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

            print(f"총 {len(unprocessed_data)}개의 분석 대상 데이터 확인됨. 분석 시작...")

            usage_updates = []
            affected_groups = set() # 업데이트가 발생한 (keyword_id, stat_date) 그룹을 추적

            # --- 2. 모델 추론 및 업데이트 대상 수집 ---
            for index, row in enumerate(unprocessed_data):
                example_id = row['example_id']
                content = row['content']
                keyword_id = row['keyword_id']
                stat_date = row['collected_date'] 
                
                # 모델 분석 실행 (라벨만 가져옴)
                label = analyze_sentiment(content)
                
                usage_updates.append((label, example_id))
                affected_groups.add((keyword_id, stat_date)) # 영향을 받는 통계 그룹 기억
                
                if (index + 1) % 500 == 0:
                    print(f"진행 중: {index + 1} / {len(unprocessed_data)} 개 완료")

            # --- 3. 개별 댓글 태그 먼저 DB에 업데이트 ---
            print("개별 댓글 DB 업데이트를 시작합니다...")
            connection.ping(reconnect=True)
            update_usage_sql = """
                UPDATE USAGE_EXAMPLE 
                SET sentiment_label = %s 
                WHERE example_id = %s
            """
            cursor.executemany(update_usage_sql, usage_updates)
            print(f"✅ USAGE_EXAMPLE 테이블: {len(usage_updates)}건 태그 업데이트 완료.")

            # --- 4. 통계 재계산 및 덮어쓰기 ---
            print("퍼센트 통계 재계산을 시작합니다...")
            stats_updates = []
            
            for kw_id, stat_date in affected_groups:
                # 해당 키워드와 날짜에 해당하는 전체 댓글의 라벨 개수를 셈
                count_sql = """
                    SELECT 
                        COUNT(*) as total_cnt,
                        SUM(CASE WHEN ue.sentiment_label = 'positive' THEN 1 ELSE 0 END) as pos_cnt,
                        SUM(CASE WHEN ue.sentiment_label = 'negative' THEN 1 ELSE 0 END) as neg_cnt,
                        SUM(CASE WHEN ue.sentiment_label = 'neutral' THEN 1 ELSE 0 END) as neu_cnt
                    FROM USAGE_EXAMPLE ue
                    JOIN KEYWORD_EXAMPLE ke ON ue.example_id = ke.example_id
                    WHERE ke.keyword_id = %s AND ue.collected_date = %s
                """
                cursor.execute(count_sql, (kw_id, stat_date))
                res = cursor.fetchone()
                
                total = res['total_cnt']
                if total > 0:
                    # 퍼센트 계산 및 소수점 둘째 자리 반올림 (예: 33.33)
                    pos_pct = round((res['pos_cnt'] / total) * 100, 2)
                    neg_pct = round((res['neg_cnt'] / total) * 100, 2)
                    neu_pct = round((res['neu_cnt'] / total) * 100, 2)
                    
                    stats_updates.append((pos_pct, neg_pct, neu_pct, kw_id, stat_date))

            # KEYWORD_STATS 테이블에 퍼센트 점수 덮어쓰기 (= 사용)
            update_stats_sql = """
                UPDATE KEYWORD_STATS
                SET positive_score = %s,
                    negative_score = %s,
                    neutral_score = %s
                WHERE keyword_id = %s AND stat_date = %s
            """
            cursor.executemany(update_stats_sql, stats_updates)
            print(f"✅ KEYWORD_STATS 테이블: {len(stats_updates)}개 그룹(키워드+날짜) 퍼센트 업데이트 완료.")

        # 모든 작업 정상 처리 시 커밋
        connection.commit()
        print(f"[{datetime.datetime.now()}] 모든 배치 작업이 성공적으로 완료되었습니다.")

    except Exception as e:
        connection.rollback()
        print(f"❌ 작업 중 에러가 발생하여 DB가 롤백되었습니다: {e}")
    finally:
        connection.close()

if __name__ == "__main__":
    run_daily_batch()
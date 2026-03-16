import sys
import json
from kiwipiepy import Kiwi

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def extract_nouns():
    kiwi = Kiwi()

    user_words = [
        '노시환', '김연아', '메시', '봄동비빔밥', '민희진', '아이브', '정준하', '김선태', '충북지사',
    ]

    for word in user_words:
        kiwi.add_user_word(word, 'NNP', 10)

    input_data = sys.stdin.read()
    if not input_data:
        print(json.dumps([]))
        return

    try:
        items = json.loads(input_data)
    except:
        items = []

    badwords = {'ㅅㅂ', '존나', '씨발', '새끼', '병신', '미친', '지랄', '좆', '개새끼', '뒤져', '미친놈', '미친년', '도태남', '한녀', '디시도태남', '한녀버튜버'}
    stopwords = {'너무', '진짜', '그냥', '많이', '이런', '정도', '저런', '그런', '이거', '저거', '그거', '어떻게', '정말', '약간', '조금', '가장', '제일', '무슨', '어떤', '무엇', '사람', '생각', '아니', '댓글', '애들', '근데', '이게', '저게', '있는', '없는', '같은', '경우', '하는', '그리고', '그래서', '오늘', '이번',
                 '최초', '협력', '상승세', '둔화', '추진', '구간', '현장'}
    
    # 뉴스 전용 불용어 추가
    news_stopwords = {'뉴스', '내일', '종합', '단독', '속보', '무단', '배포', '금지', '기자', '재배포', '연합뉴스', '오전', '오후', '대한민국', '한겨레', '조선일보', '중앙일보', '동아일보', '경향신문', '매일경제', '디지털투데', '확대', '뉴스1', 'MBC뉴스', '부산경남', 'knn', 'co', 'kr', 'bntnews', '한국경제', 'vs', '다시'}

    extracted_data = []
    
    for item in items:
        text = item.get('text', '')
        platform = item.get('platform', 'unknown')
        item_type = item.get('type', 'trend') # 기본값은 트렌드(워드클라우드)
        
        if not isinstance(text, str) or not text.strip():
            continue
            
        tokens = kiwi.tokenize(text)
        
        for token in tokens:
            # 일반명사(NNG)와 고유명사(NNP)만 추출
            if token.tag in ('NNG', 'NNP'):
                word = token.form
                
                # 1차 공통 필터링
                if len(word) > 1 and word not in badwords and word not in stopwords:
                    # 2차 뉴스 전용 필터링
                    if item_type == 'news' and word in news_stopwords:
                        continue
                        
                    extracted_data.append({
                        "word": word, 
                        "platform": platform,
                        "type": item_type
                    })

    print(json.dumps(extracted_data, ensure_ascii=False))

if __name__ == '__main__':
    extract_nouns()
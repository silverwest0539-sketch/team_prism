import sys
import json
from kiwipiepy import Kiwi

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def extract_nouns():
    kiwi = Kiwi()

    user_words = [
        '노시환', '김연아', '메시', '봄동비빔밥', '민희진', '아이브'
    ]

    for word in user_words:
        # 단어, 품사(NNP=고유명사), 우선순위(기본값보다 높은 10 적용)
        kiwi.add_user_word(word, 'NNP', 10)

    # 1. Node.js로부터 표준 입력(stdin)으로 데이터 받기
    input_data = sys.stdin.read()
    if not input_data:
        print(json.dumps([]))
        return

    try:
        comments = json.loads(input_data)
    except:
        comments = []

    # 🚫 비속어 및 불용어 사전 (여기에 지속적으로 단어 추가!)
    badwords = {'ㅅㅂ', '존나', '씨발', '새끼', '병신', '미친', '지랄', '좆', '개새끼', '뒤져', '미친놈', '미친년'}
    stopwords = {'너무', '진짜', '그냥', '많이', '이런', '정도', '저런', '그런', '이거', '저거', '그거', '어떻게', '정말', '약간', '조금', '가장', '제일', '무슨', '어떤', '무엇', '사람', '생각', '아니', '댓글', '애들', '근데', '이게', '저게', '있는', '없는', '같은', '경우', '하는', '그리고', '그래서', '오늘'}

    extracted_nouns = []
    
    for comment in comments:
        if not isinstance(comment, str) or not comment.strip():
            continue
            
        # 2. Kiwi를 이용한 형태소 분석
        tokens = kiwi.tokenize(comment)
        
        for token in tokens:
            # 🎯 NNG(일반 명사), NNP(고유 명사)만 추출
            if token.tag in ('NNG', 'NNP'):
                word = token.form
                # 2글자 이상, 불용어/비속어 제외
                if len(word) > 1 and word not in badwords and word not in stopwords:
                    extracted_nouns.append(word)

    # 3. 추출된 명사 리스트를 다시 JSON 문자열로 Node.js에 반환
    print(json.dumps(extracted_nouns, ensure_ascii=False))

if __name__ == '__main__':
    extract_nouns()
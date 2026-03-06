import sys
import json
from kiwipiepy import Kiwi

sys.stdin.reconfigure(encoding='utf-8')
sys.stdout.reconfigure(encoding='utf-8')

def extract_nouns():
    kiwi = Kiwi()

    user_words = [
        '노시환', '김연아', '메시', '봄동비빔밥', '민희진', '아이브', '정준하', '김선태'
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
        # Node.js에서 [{ "text": "...", "platform": "youtube" }] 형태로 넘어옵니다.
        items = json.loads(input_data)
    except:
        items = []

    badwords = {'ㅅㅂ', '존나', '씨발', '새끼', '병신', '미친', '지랄', '좆', '개새끼', '뒤져', '미친놈', '미친년'}
    stopwords = {'너무', '진짜', '그냥', '많이', '이런', '정도', '저런', '그런', '이거', '저거', '그거', '어떻게', '정말', '약간', '조금', '가장', '제일', '무슨', '어떤', '무엇', '사람', '생각', '아니', '댓글', '애들', '근데', '이게', '저게', '있는', '없는', '같은', '경우', '하는', '그리고', '그래서', '오늘'}

    extracted_data = []
    
    for item in items:
        # 텍스트와 플랫폼 정보를 함께 빼냅니다.
        text = item.get('text', '')
        platform = item.get('platform', 'unknown')
        
        if not isinstance(text, str) or not text.strip():
            continue
            
        tokens = kiwi.tokenize(text)
        
        for token in tokens:
            if token.tag in ('NNG', 'NNP'):
                word = token.form
                if len(word) > 1 and word not in badwords and word not in stopwords:
                    # 단어와 해당 단어가 나온 플랫폼을 딕셔너리로 묶어서 저장합니다.
                    extracted_data.append({"word": word, "platform": platform})

    print(json.dumps(extracted_data, ensure_ascii=False))

if __name__ == '__main__':
    extract_nouns()
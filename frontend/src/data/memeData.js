export const memeData = [
  {
    id: 1,
    title: '생면 파스타 챌린지',
    description: '브이로그와 요리 채널을 중심으로 확산 중. \'정성\'과 \'낭만\'을 강조하는 자막이 포인트.',
    context: '대중적 트렌드',
    contextType: 'safe',
    source: 'youtube',
    mentions: '3.4K',
    positiveRate: '88%',
    chartData: [10, 25, 40, 55, 80],
    chartColor: '#00b894',
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=400&auto=format&fit=crop',
    riskLevel: '안전'
  },
  {
    id: 2,
    title: '15연패 아칼리',
    description: '스트리머 \'랄로\'의 방송 사고에서 유래. 게임에서 연속으로 질 때 사용하는 자조적 밈.',
    context: '팬덤/내수용',
    contextType: 'caution',
    source: 'youtube',
    mentions: '높음 (90% 집중)',
    positiveRate: '롤/게임',
    chartData: [5, 90, 85, 40, 20],
    chartColor: '#fdcb6e',
    imageUrl: 'https://img.youtube.com/vi/HPSHo89XnHQ/mqdefault.jpg',
    riskLevel: '주의'
  },
  {
    id: 3,
    title: '두쫀쿠 (두툼 쫀득 쿠키)',
    description: '[AI 요약] \'두툼하고 쫀득한 쿠키\'의 줄임말. 최근 디저트 먹방 댓글에서 급증하는 신조어.',
    context: '신조어 발견',
    contextType: 'new',
    source: 'youtube',
    mentions: 'LLM 추론됨',
    positiveRate: '▲ 급등',
    chartData: [0, 0, 10, 30, 60],
    chartColor: '#74b9ff',
    imageUrl: 'https://images.unsplash.com/photo-1499636138143-bd649043ea52?q=80&w=400&auto=format&fit=crop',
    riskLevel: '신규'
  },
  {
    id: 4,
    title: '정치/사회적 혐오 용어',
    description: '커뮤니티(DC) 실시간 베스트 게시판에서 추출된 키워드이나 가이드라인 위반.',
    context: '위험 단계',
    contextType: 'toxic',
    source: 'dc',
    mentions: '심각',
    chartData: [],
    imageUrl: '',
    riskLevel: '위험',
    isToxic: true
  }
];
export const DUMMY_DATA = {
  rank: '-',
  score: 0,
  totalMentions: 0,
  history: [
    { date: '20240101', mentions: 20 },
    { date: '20240102', mentions: 40 },
    { date: '20240103', mentions: 30 },
    { date: '20240104', mentions: 70 },
    { date: '20240105', mentions: 50 },
    { date: '20240106', mentions: 90 },
  ],
  comments: [],
};

export const PLATFORM_OPTIONS = [
  { label: '전체 플랫폼', value: 'all' },
  { label: '유튜브', value: 'youtube' },
  { label: '더쿠', value: 'theqoo' },
  { label: '디시인사이드', value: 'dcinside' },
  { label: '루리웹', value: 'ruliweb' },
  { label: '인스티즈', value: 'instiz' },
  { label: 'FM코리아', value: 'fmkorea' },
];

export const SENTIMENT_DATA = [
  { name: '긍정', value: 65, color: '#4F46E5' },
  { name: '중립', value: 25, color: '#9CA3AF' },
  { name: '부정', value: 10, color: '#EF4444' },
];

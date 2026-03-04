const express = require('express');
const cors = require('cors');
const { loadTrendData } = require('./dataLoader');
const scrapRoutes = require('./routes/scrap.routes');
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const trendRoutes = require('./routes/trend.routes');
const summaryRoutes = require('./routes/summary.routes');
const promptRoutes = require('./routes/prompt.routes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/scraps', scrapRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', trendRoutes);
app.use('/api', summaryRoutes);
app.use('/api', promptRoutes);

// 서버 시작
loadTrendData().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // 서버 타임아웃을 120,000ms (2분)으로 설정
  // OpenAI API 응답이 길어질 경우를 대비해 넉넉하게 설정합니다.
  server.timeout = 120000;
});
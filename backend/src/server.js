const express = require('express');
const cors = require('cors');
const { loadTrendData } = require('./dataLoader');
const scrapRoutes = require('./routes/scrap.routes');
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const trendRoutes = require('./routes/trend.routes');
const summaryRoutes = require('./routes/summary.routes');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/scraps', scrapRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', trendRoutes);
app.use('/api', summaryRoutes);

// 서버 시작
loadTrendData().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
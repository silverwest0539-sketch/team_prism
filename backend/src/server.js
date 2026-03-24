const express = require('express');
const cors = require('cors');
const { loadTrendData } = require('./dataLoader');
const { checkAndSyncS3 } = require('./s3Sync');
const scrapRoutes = require('./routes/scrap.routes');
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const trendRoutes = require('./routes/trend.routes');
const summaryRoutes = require('./routes/summary.routes');
const promptRoutes = require('./routes/prompt.routes');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: [
    'http://localhost:5173', // 로컬 개발용
    'https://pickey.cloud',  // 새로 연결한 프론트엔드 도메인
    'https://www.pickey.cloud' // www를 사용할 경우를 대비해 추가
  ], 
  credentials: true,
}));
app.use(express.json());

app.use('/api/scraps', scrapRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', trendRoutes);
app.use('/api', summaryRoutes);
app.use('/api', promptRoutes);

let server;

// 서버 시작
loadTrendData().then(() => {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  server.timeout = 120000;
  // --- S3 동기화 백그라운드 작업 시작 ---
  // 1. 서버 시작 시 즉시 1회 확인 및 동기화
  checkAndSyncS3();
  // 2. 이후 24시간(86,400,000ms)마다 반복 실행
  setInterval(() => {
    checkAndSyncS3();
  }, 24 * 60 * 60 * 1000);
});

let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[${signal}] 서버 종료 시작...`);

  if (server) {
    server.close(async (err) => {
      if (err) {
        console.error("HTTP 서버 종료 중 오류:", err);
      } else {
        console.log("HTTP 서버 종료 완료");
      }

      try {
        await db.end();
        console.log("DB 커넥션 풀 종료 완료");
        process.exit(0);
      } catch (dbErr) {
        console.error("DB 커넥션 풀 종료 실패:", dbErr);
        process.exit(1);
      }
    });
  } else {
    // 서버가 채 실행되기 전에 종료 시그널을 받은 경우
    try {
      await db.end();
      console.log("DB 커넥션 풀 종료 완료 (HTTP 서버 미실행 상태)");
      process.exit(0);
    } catch (dbErr) {
      console.error("DB 커넥션 풀 종료 실패:", dbErr);
      process.exit(1);
    }
  }

  setTimeout(() => {
    console.error("종료 지연으로 강제 종료합니다.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});
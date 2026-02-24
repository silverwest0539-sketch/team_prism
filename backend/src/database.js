// src/database.js
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS, // .env의 DB_PASS와 일치시킨 설정
  database: process.env.DB_NAME,
  port: 3307,
  waitForConnections: true,
  connectionLimit: 15, 
  queueLimit: 0
});

// 테스트용 연결 확인 로직 (서버 실행 시 초기 1회)
pool.getConnection()
  .then(conn => {
    console.log('✅ DB 연결 성공 (project-db-cgi.smhrd.com)');
    conn.release();
  })
  .catch(err => {
    console.error('❌ DB 연결 실패:', err.message);
  });

module.exports = pool;
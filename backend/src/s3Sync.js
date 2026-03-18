const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');

const dataDirectory = path.join(__dirname, '../data');

// 확인해야 할 S3 폴더 목록
const s3Folders = ['dc', 'fm', 'instiz', 'ruliweb', 'theqoo'];

// 플랫폼별 로컬 파일 접두사 매핑
const prefixMap = {
  'theqoo': 'theqoo_hot_selector_',
  'ruliweb': 'ruliweb_full_',
  'instiz': 'instiz_',      
  'fm': 'fmkorea_',
  'dc': 'final_dc_best_DC_Best_'
};

/**
 * 5개 폴더의 최신 파일을 확인하고, 모두 새로운 파일일 때만 동기화를 수행합니다.
 */
const checkAndSyncS3 = async () => {
  // 1. 필수 환경 변수 존재 여부 확인 (개발 모드 분기)
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('[Sync Info] AWS 자격 증명이 설정되지 않았습니다. S3 동기화를 생략하고 로컬 데이터만 사용합니다.');
    return; // 여기서 함수를 종료하여 S3 요청을 방지합니다.
  }

  // 환경 변수가 있을 때만 S3 클라이언트 초기화 및 BUCKET_NAME 설정
  const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-2' });
  const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'prism-dataset-0313';

  console.log('[Background Task] S3 데이터 동기화 조건 확인 시작...');

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
  }

  try {
    const latestFilesToDownload = [];

    // 2. 5개 폴더 각각의 최신 파일 정보 확인
    for (const folder of s3Folders) {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: `data_upload/${folder}/`
      });

      const response = await s3Client.send(command);
      
      if (!response.Contents || response.Contents.length === 0) {
        console.log(`[Sync Info] ${folder} 폴더에 파일이 없습니다. 동기화를 보류합니다.`);
        return; 
      }

      const jsonFiles = response.Contents.filter(item => item.Key.endsWith('.json'));
      if (jsonFiles.length === 0) {
        console.log(`[Sync Info] ${folder} 폴더에 JSON 파일이 없습니다. 동기화를 보류합니다.`);
        return;
      }

      const latestFile = jsonFiles.sort((a, b) => {
        const nameA = path.basename(a.Key);
        const nameB = path.basename(b.Key);
        return nameB.localeCompare(nameA);
      })[0];      
      
      latestFile.folderName = folder; 
      latestFilesToDownload.push(latestFile);
    }

    // 3. 추출된 5개의 최신 파일이 모두 로컬에 없는 '새로운' 파일인지 검사
    let allFilesAreNew = true;
    for (const file of latestFilesToDownload) {
      const fileName = path.basename(file.Key);
      const localFilePath = path.join(dataDirectory, fileName);
      
      if (fs.existsSync(localFilePath)) {
        allFilesAreNew = false;
        break; 
      }
    }

    // 4. 조건 불충족 시 다운로드를 수행하지 않고 중단
    if (!allFilesAreNew) {
      console.log('[Sync Info] 5개 폴더 모두에 새로운 파일이 업로드되지는 않았습니다. 대기합니다.');
      return;
    }

    console.log('[Sync Start] 5개 폴더 모두에 새로운 파일이 확인되었습니다. 일괄 다운로드를 시작합니다.');

    // 5. 다운로드 진행
    for (const file of latestFilesToDownload) {
      const fileName = path.basename(file.Key);
      const localFilePath = path.join(dataDirectory, fileName);

      const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: file.Key });
      const getResponse = await s3Client.send(getCommand);
      
      const writeStream = fs.createWriteStream(localFilePath);
      await pipeline(getResponse.Body, writeStream);
      console.log(`[Sync Success] 다운로드 완료: ${fileName}`);
    }

    // 6. 다운로드 완료 후 플랫폼별 최신 파일 1개만 남기고 삭제
    cleanUpOldFiles();

  } catch (error) {
    console.error('[Sync Error] S3 동기화 과정 중 오류 발생:', error.message);
  }
};

/**
 * 로컬 폴더에서 플랫폼별 가장 최신 파일 1개를 제외한 나머지 과거 파일을 모두 삭제합니다.
 */
const cleanUpOldFiles = () => {
  try {
    const files = fs.readdirSync(dataDirectory).filter(file => file.endsWith('.json'));

    for (const [folder, prefix] of Object.entries(prefixMap)) {
      const platformFiles = files.filter(file => file.startsWith(prefix));

      if (platformFiles.length > 1) {
        platformFiles.sort((a, b) => {
          const statA = fs.statSync(path.join(dataDirectory, a)).mtimeMs;
          const statB = fs.statSync(path.join(dataDirectory, b)).mtimeMs;
          return statB - statA; 
        });

        const filesToDelete = platformFiles.slice(1);
        
        filesToDelete.forEach(fileToDelete => {
          fs.unlinkSync(path.join(dataDirectory, fileToDelete));
          console.log(`[CleanUp] 과거 데이터 삭제 완료: ${fileToDelete}`);
        });
      }
    }
    console.log('[CleanUp] 플랫폼별 최신 데이터(1개) 단일화 정리 완료.');
  } catch (error) {
    console.error('[CleanUp Error] 로컬 파일 정리 실패:', error.message);
  }
};

module.exports = { checkAndSyncS3 };
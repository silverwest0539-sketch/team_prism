import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 현재 프로젝트 기준으로 경고 임계값을 현실적으로 조정
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // 차트 라이브러리는 별도 청크로 분리해 초기 번들 부담을 줄임
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts'
          }

          // 그 외 외부 모듈은 단일 vendor로 묶어 순환 의존 경고를 방지
          return 'vendor'
        },
      },
    },
  },
})

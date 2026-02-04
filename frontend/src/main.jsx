import React from 'react'
import ReactDOM from 'react-dom/client' // <--- 이 줄이 빠져서 에러가 났던 것입니다!
import App from './App.jsx'
import './styles/index.css' // <--- Tailwind CSS 적용을 위해 필수

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
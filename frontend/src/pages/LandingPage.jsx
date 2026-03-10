// src/pages/LandingPage.jsx
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let stars = [];

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();

    // 네트워크 입자(별자리 점) 설정
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5; // 이동 속도
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw(color) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // 배경의 반짝이는 별무리 (투명도만 부드럽게 변함)
    class Star {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5 + 0.5;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 0.02 + 0.005;
      }

      draw() {
        this.phase += this.speed;
        // 깜빡임 효과 (최대 투명도 0.6으로 설정하여 너무 눈부시지 않게)
        const opacity = (Math.sin(this.phase) + 1) / 2 * 0.6;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      stars = [];
      // 입자 개수를 기존 15000에서 30000으로 나누어 절반으로 줄임
      const particleCount = Math.floor((canvas.width * canvas.height) / 30000); 
      const starCount = Math.floor((canvas.width * canvas.height) / 8000);
      
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
      for (let i = 0; i < starCount; i++) stars.push(new Star());
    };
    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 점과 선의 색상 (밝은 배경에 맞게 살짝 진한 네이비/퍼플 톤 적용)
      const r = 90;
      const g = 100;
      const b = 150;
      const particleColor = `rgba(${r}, ${g}, ${b}, 0.8)`;

      // 별 무리 그리기
      stars.forEach(star => star.draw());

      // 네트워크 선 그리기
      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 160) { 
            const opacity = 1 - (distance / 160);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`; // 선의 진하기 조절
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // 점 업데이트 및 그리기
      particles.forEach(particle => {
        particle.update();
        particle.draw(particleColor);
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    // 배경색을 밝고 세련된 그레이-블루 톤으로 고정 (bg-[#e8ebf2])
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-[#e8ebf2]">
      
      {/* 애니메이션 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* 메인 컨텐츠 영역 */}
      <div className="relative z-10 mb-12 mt-8">
        <p className="font-bold text-lg mb-4 text-gray-600 tracking-wide">
          데이터 속 숨겨진 인사이트를 찾다
        </p>
        
        <h1 className="text-6xl sm:text-7xl font-extrabold text-indigo-500 mb-6 tracking-tight drop-shadow-md" 
            style={{ textShadow: '0px 4px 20px rgba(99, 102, 241, 0.3)' }}>
          PicKey
        </h1>
        
        <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto text-gray-700 font-medium">
          빅데이터 분석과 AI 예측으로<br />
          마케팅의 새로운 기회를 발견하세요.
        </p>
      </div>

      {/* 메인 액션 버튼 */}
      <button 
        onClick={() => navigate('/home')}
        className="relative z-10 bg-indigo-600 text-white font-bold text-lg sm:text-xl px-12 py-4 rounded-full shadow-[0_4_20px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:shadow-[0_4_25px_rgba(79,70,229,0.6)] transform hover:-translate-y-1 transition-all duration-300"
      >
        지금 시작하기
      </button>

      {/* 하단 링크 영역 (깜박임 제거, 일반 hover 효과 적용) */}
      <div className="relative z-10 mt-12 flex flex-wrap justify-center gap-6 font-medium text-gray-500">
        <Link to="/login" className="hover:text-indigo-600 transition-colors duration-200">
          로그인
        </Link>
        <span className="text-gray-400">|</span>
        <Link to="/signup" className="hover:text-indigo-600 transition-colors duration-200">
          회원가입
        </Link>
      </div>

    </div>
  );
};

export default LandingPage;
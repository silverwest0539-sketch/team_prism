// src/pages/LandingPage.jsx
import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

class Particle {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1.5;
  }

  update(width, height) {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw(ctx, color) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

class Star {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.radius = Math.random() * 1.5 + 0.5;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.02 + 0.005;
  }

  draw(ctx) {
    this.phase += this.speed;
    const opacity = ((Math.sin(this.phase) + 1) / 2) * 0.6;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fill();
  }
}

const LandingPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrameId;
    let particles = [];
    let stars = [];

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      stars = [];

      const particleCount = Math.floor((canvas.width * canvas.height) / 30000);
      const starCount = Math.floor((canvas.width * canvas.height) / 8000);

      for (let i = 0; i < particleCount; i += 1) {
        particles.push(new Particle(canvas.width, canvas.height));
      }

      for (let i = 0; i < starCount; i += 1) {
        stars.push(new Star(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const r = 90;
      const g = 100;
      const b = 150;
      const particleColor = `rgba(${r}, ${g}, ${b}, 0.8)`;

      stars.forEach((star) => star.draw(ctx));

      ctx.lineWidth = 0.8;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 160) {
            const opacity = 1 - distance / 160;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((particle) => {
        particle.update(canvas.width, canvas.height);
        particle.draw(ctx, particleColor);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', setCanvasSize);
    setCanvasSize();
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden bg-[#e8ebf2]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <div className="relative z-10 mb-12 mt-8">
        <p className="font-bold text-lg mb-4 text-gray-600 tracking-wide">
          데이터 속 숨겨진 인사이트를 찾다
        </p>

        <h1 className="mb-6">
          <img
            src="/PicKeyLogo_indigo.svg"
            alt="PicKey"
            className="h-[3.75rem] sm:h-[4.5rem] w-auto mx-auto"
          />
        </h1>

        <p className="text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto text-gray-700 font-medium">
          빅데이터 분석과 AI 예측으로
          <br />
          마케팅의 새로운 기회를 발견하세요.
        </p>
      </div>

      <button
        onClick={() => navigate('/home')}
        className="relative z-10 bg-indigo-600 text-white font-bold text-lg sm:text-xl px-12 py-4 rounded-full shadow-[0_4_20px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:shadow-[0_4_25px_rgba(79,70,229,0.6)] transform hover:-translate-y-1 transition-all duration-300"
      >
        지금 시작하기
      </button>

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

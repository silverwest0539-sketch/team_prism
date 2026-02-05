// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { PlayCircle } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';
import HeaderActions from '../components/common/HeaderActions';
import SummaryModal from '../components/home/SummaryModal';
import { formatViews, formatDate } from '../utils/formatters';

const HomePage = () => {
  
  // 상태 관리
  const [risingKeywords, setRisingKeywords] = useState([]); 
  const [risingPlatforms, setRisingPlatforms] = useState([]); 
  const [selectedPlatform, setSelectedPlatform] = useState('youtube'); 
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeCategory, setYoutubeCategory] = useState('전체');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  const platformLabels = {
    'youtube': '유튜브',
    'dcinside': '롤갤러리',
    'theqoo': '더쿠',
    'natepan': '네이트판',
    'fmkorea': 'fmkorea',
    'ruliweb': '루리웹',
    'x': 'x'
  };

  const youtubecategories = ['전체', '게임', '라이프', '음악', '일상', '코미디'];

  const openModal = (data) => {
    setSelectedKeyword(data);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // API 호출
  useEffect(() => {
    fetch('http://localhost:5000/api/trends/rising')
      .then(res => res.json())
      .then(data => setRisingKeywords(data.slice(0, 5))) 
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    let url = 'http://localhost:5000/api/trends/platform';
    if (selectedPlatform !== 'all') {
      url += `?platform=${selectedPlatform}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => setRisingPlatforms(data))
      .catch(err => console.error(err));
  }, [selectedPlatform]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/youtube/list?category=${youtubeCategory}`)
      .then(res => res.json())
      .then(data => setYoutubeVideos(data))
      .catch(err => console.error("유튜브 데이터 로드 실패:", err));
  }, [youtubeCategory]);

  return (
    <div 
      className="page"
      onClick={() => isDropdownOpen && setIsDropdownOpen(false)}
    >
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-start mb-8">
        <SearchBar placeholder="관심있는 키워드나 주제를 검색해보세요..." />
        
        <div className="absolute right-8 top-8">
          <HeaderActions showNotificationText notificationText="Cont..." />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-8">안녕하세요, 마케터님 👋</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        
        {/* 카드 1: 트렌드 키워드 */}
        <div className="card-soft">
          <div className="flex justify-between items-center mb-6 h-10">
            <h2 className="section-title-lg border-b-2 border-transparent hover:border-black transition-colors">
              트렌드 키워드 Top 5
            </h2>
            <span className="text-xs text-gray-400">실시간 기준</span>
          </div>
          
          <ul className="flex flex-col gap-2">
            {risingKeywords.map((item, index) => (
              <li 
                key={index} 
                onClick={() => openModal({ 
                  keyword: item.keyword,
                  rank: item.rank,
                  score: item.score,
                  title: item.keyword,
                  desc: `${item.keyword}에 대한 트렌드 요약입니다.`,
                  type: 'trend'
                })}
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-blue-600 w-3 text-center">{item.rank}</span>
                  <p className="font-medium text-gray-900">{item.keyword}</p>
                </div>
                <div className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.isUp === false ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.change}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 카드 2: 플랫폼별 키워드 */}
        <div className="card-soft relative">
          <div className="flex justify-between items-center mb-6 h-10">
            <h2 className="section-title-lg">
              플랫폼별 키워드
            </h2>
            
            <div 
              className="tab-wrap"
              onClick={(e) => e.stopPropagation()} 
            >
              <button 
                onClick={() => {
                  setSelectedPlatform('youtube');
                  setIsDropdownOpen(false);
                }}
                className={`tab-btn ${selectedPlatform === 'youtube' ? 'tab-active text-red-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                유튜브
              </button>

              <div className="w-[1px] h-3 bg-gray-300 mx-1"></div>

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`tab-btn flex items-center gap-1 ${
                    selectedPlatform !== 'youtube'
                      ? 'tab-active text-green-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span>
                    {selectedPlatform === 'youtube' 
                      ? '커뮤니티' 
                      : platformLabels[selectedPlatform] || '커뮤니티'}
                  </span>
                  <svg 
                    className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                    {Object.entries(platformLabels).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedPlatform(key);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                          selectedPlatform === key ? 'text-green-600 font-bold bg-green-50' : 'text-gray-600'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {risingPlatforms.map((item, index) => (
              <li 
                key={index} 
                onClick={() => openModal({ 
                  keyword: item.keyword,
                  rank: index +1,
                  score: item.count,
                  title: item.keyword,
                  desc: `${item.keyword}에 대한 트렌드 요약입니다.`,
                  type : 'platform'
                })}
                className="flex items-center gap-4 text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12"
              >
                <span className="font-bold text-blue-600 w-3 text-center">{item.rank || index + 1 }</span>
                
                <div className="flex items-baseline overflow-hidden">
                  <span className="font-medium text-gray-900 whitespace-nowrap">
                    {item.keyword}
                  </span>
                  <span className="text-xs text-gray-400 truncate ml-3">
                    {item.count? `${item.count}회` : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 유튜브 섹션 */}
      <div className="mb-8">
        <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1 mb-4">
          유튜브 일일 급상승 동영상
        </h2>

        <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
          {youtubecategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setYoutubeCategory(cat)}
              className={`chip ${youtubeCategory === cat ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {youtubeVideos.slice(0, 5).map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="video-card"
            >
              <div className="relative w-full aspect-video bg-gray-200">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="text-white w-10 h-10 drop-shadow-lg" />
                </div>
              </div>

              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">{video.channel}</p>
                </div>

                <div className="mt-2 text-[11px] text-gray-400">
                  <span>{formatViews(video.views)}</span>
                  <span>•</span>
                  <span>{formatDate(video.publish_time)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* 모달 */}
      <SummaryModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        data={selectedKeyword} 
      />
    </div>
  );
};

export default HomePage;
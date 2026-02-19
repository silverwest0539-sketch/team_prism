// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import { PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';
import HeaderActions from '../components/common/HeaderActions';
import SummaryModal from '../components/home/SummaryModal';
import { formatViews, formatDate } from '../utils/formatters';

const HomePage = () => {
  const navigate = useNavigate();
  
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

  const scrollRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      // 여기에 검색 실행 로직을 작성하세요 (예: 페이지 이동, API 호출 등)
      navigate(`/analysis?keyword=${searchTerm.trim()}`)
    }
  };

  const MAIN_PLATFORM_OPTIONS = [
    { label: '전체 플랫폼', value: 'all' },
    { label: '유튜브', value: 'youtube' },
    { label: '더쿠', value: 'theqoo' },
    { label: '디시인사이드', value: 'dcinside' }, // 상세: dc -> 메인: dcinside 유지
    { label: '루리웹', value: 'ruliweb' },
    { label: '네이트판', value: 'natepan' }, // 상세: nate -> 메인: natepan 유지
    { label: 'FM코리아', value: 'fmkorea' },
    { label: 'X (트위터)', value: 'x' }, // 상세: x_trends -> 메인: x 유지
  ];

  const CATEGORY_TABS = ['전체', '음악', '엔터테인먼트', '게임', '뉴스', '스포츠', '영화/드라마', '브이로그', '챌린지'];

  const openModal = (data) => {
    setSelectedKeyword(data);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // 스크롤 핸들러 함수
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // 한 번 클릭 시 이동할 거리 (약 카드 1~2개 너비 + gap)
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // API 호출
  useEffect(() => {
      const fetchData = async () => {
        try {
          // 1. 급상승 키워드 로드 (기존 유지)
          const trendRes = await fetch('http://localhost:5000/api/trends/rising');
          const trendData = await trendRes.json();
          setRisingKeywords(trendData);

          // 2. 급상승 플랫폼 로드 (기존 유지)
          const platformRes = await fetch(`http://localhost:5000/api/trends/platform?platform=${selectedPlatform}`);
          const platformData = await platformRes.json();
          setRisingPlatforms(platformData);

          // ✅ 3. 유튜브 인기 동영상 로드 (카테고리 파라미터 추가!)
          // 기존: fetch('http://localhost:5000/api/videos')
          // 수정: 쿼리스트링으로 카테고리 전달
          const videoRes = await fetch(`http://localhost:5000/api/videos?category=${encodeURIComponent(youtubeCategory)}`);
          const videoData = await videoRes.json();
          setYoutubeVideos(videoData);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }, [selectedPlatform, youtubeCategory]);

  return (
    <div 
      className="page"
      onClick={() => isDropdownOpen && setIsDropdownOpen(false)}
    >
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-start mb-8">
        <SearchBar 
          placeholder="관심있는 키워드나 주제를 검색해보세요..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
        />
        
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

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`tab-btn flex items-center gap-1 ${
                    // [수정] 유튜브/다른커뮤니티 구분 없이, 드롭다운이 열려있거나 값이 선택되어 있으면 활성화 색상(초록) 적용
                    isDropdownOpen || selectedPlatform 
                      ? 'tab-active text-green-600' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="font-medium">
                    {/* [수정] 복잡한 삼항연산자 제거 -> 선택된 값의 Label을 그대로 표시 */}
                    {MAIN_PLATFORM_OPTIONS.find(opt => opt.value === selectedPlatform)?.label || '커뮤니티'}
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
                    {MAIN_PLATFORM_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedPlatform(option.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                          selectedPlatform === option.value ? 'text-green-600 font-bold bg-green-50' : 'text-gray-600'
                        }`}
                      >
                        {option.label}
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
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 유튜브 섹션 */}
      <div className="mb-8 relative group"> {/* group 클래스 추가: 호버 시 버튼 표시 등 활용 가능 */}
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">
            유튜브 일일 급상승 동영상
          </h2>
          
          {/* 카테고리 탭 (우측 정렬이 필요하면 여기서 조정, 현재는 원래 위치 유지 위해 아래 div 사용) */}
        </div>

        <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setYoutubeCategory(cat)}
              className={`chip ${youtubeCategory === cat ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        {/* 슬라이더 컨테이너 */}
        <div className="relative">
          
          {/* 왼쪽 화살표 버튼 */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous videos"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* 비디오 리스트 (Grid -> Flex & Scroll) */}
          {/* slice(0, 5) -> slice(0, 10)으로 변경 */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth pb-4 px-1"
          >
            {youtubeVideos.slice(0, 10).map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="video-card flex-none w-[100px] sm:w-[100px] lg:w-[19%] min-w-[100px]"
              >
                <div className="relative w-full aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-10 h-10 drop-shadow-lg" />
                  </div>
                </div>

                <div className="p-4 flex flex-col justify-between flex-1 bg-white border-x border-b border-gray-100 rounded-b-lg">
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

          {/* 오른쪽 화살표 버튼 */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next videos"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

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
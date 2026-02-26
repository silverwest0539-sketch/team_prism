// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import { PlayCircle, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';
import SummaryModal from '../components/home/SummaryModal';
import { formatViews, formatDate } from '../utils/formatters';
import { toApiUrl } from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { navigateToAnalysisOnEnter } from '../utils/searchNavigation';


const HomePage = () => {
  const navigate = useNavigate();
  
  // 상태 관리
  const [risingKeywords, setRisingKeywords] = useState([]); 
  const [risingPlatforms, setRisingPlatforms] = useState([]); 
  const [selectedPlatform, setSelectedPlatform] = useState('youtube'); 
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeCategory, setYoutubeCategory] = useState('전체');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName] = useState(() => getStoredUser()?.nickname || '');
  
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [selectedComm, setSelectedComm] = useState('theqoo');

  // [추가] 트렌드 더보기 모달 상태
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);

  const scrollRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    navigateToAnalysisOnEnter({
      event: e,
      keyword: searchTerm,
      navigate,
    });
  };

  const COMMUNITY_OPTIONS = [
    { label: '더쿠', value: 'theqoo' },
    { label: '디시인사이드', value: 'dcinside' },
    { label: '루리웹', value: 'ruliweb' },
    { label: '네이트판', value: 'natepan' },
    { label: 'FM코리아', value: 'fmkorea' },
  ];

  const MAIN_PLATFORM_OPTIONS = [
    { label: '유튜브', value: 'youtube' },
    { label: '더쿠', value: 'theqoo' },
    { label: '디시인사이드', value: 'dcinside' },
    { label: '루리웹', value: 'ruliweb' },
    { label: '네이트판', value: 'natepan' },
    { label: 'FM코리아', value: 'fmkorea' },
  ];

  const CATEGORY_TABS = ['전체', '음악', '엔터테인먼트', '게임', '뉴스', '스포츠', '브이로그'];

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
          const trendRes = await fetch(toApiUrl('/trends/rising'));
          const trendData = await trendRes.json();
          setRisingKeywords(trendData);

          // 2. 플랫폼별 트렌드 로드 (기존 유지)
          const platformParams = new URLSearchParams({ platform: String(selectedPlatform || '') });
          const platformRes = await fetch(toApiUrl(`/trends/platform?${platformParams.toString()}`));
          const platformData = await platformRes.json();
          setRisingPlatforms(platformData);

          // 3. 유튜브 인기 동영상 로드 
          const videoParams = new URLSearchParams({ category: String(youtubeCategory || '') });
          const videoRes = await fetch(toApiUrl(`/videos?${videoParams.toString()}`));
          const videoData = await videoRes.json();
          setYoutubeVideos(videoData);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }, [selectedPlatform, youtubeCategory]);

  useEffect(() => {
    // 커뮤니티 인기글 불러오기
    const fetchCommunityPosts = async () => {
      try {
        const communityParams = new URLSearchParams({ platform: String(selectedComm || '') });
        const res = await fetch(toApiUrl(`/community/posts?${communityParams.toString()}`));
        const data = await res.json();
        setCommunityPosts(data);
      } catch (error) {
        console.error('커뮤니티 인기글 로드 에러:', error);
      }
    };

    fetchCommunityPosts();
  }, [selectedComm]);

  return (
    <div 
      className="page"
      onClick={() => isDropdownOpen && setIsDropdownOpen(false)}
    >
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-start mb-6">
        <SearchBar 
          placeholder="관심있는 키워드나 주제를 검색해보세요..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          containerClassName="relative w-full max-w-3xl"
        />  

      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">안녕하세요, {userName}님 </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
        
        
        {/* 카드 1: 트렌드 급상승 키워드 */}
        <div className="card-soft">
          {/* 헤더 */}
          <div className="flex justify-between items-end mb-4 border-b pb-2 border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              오늘의 트렌드 키워드 Top 5
            </h2>
            <button 
              onClick={() => setIsTrendModalOpen(true)}
              className="text-xs text-gray-400 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
            >
              더보기 <Plus size={12} />
            </button>
          </div>
          
          <ul className="flex flex-col gap-2">
            {risingKeywords.slice(0, 5).map((item, index) => (
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

        {/* 카드 2: 플랫폼별 급상승 키워드 */}
        <div className="card-soft relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title-lg">
              오늘의 플랫폼별 키워드 Top 5
            </h2>
            <div
              className="tab-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`tab-btn flex items-center gap-1 ${
                    isDropdownOpen || selectedPlatform
                      ? 'tab-active text-green-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="font-medium">
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
      <div className="mb-8 relative group"> 
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">
            유튜브 일일 급상승 동영상
          </h2>
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
            className="hidden sm:flex absolute left-1 lg:left-0 top-1/2 -translate-y-1/2 lg:-ml-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous videos"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* 비디오 리스트 (Grid -> Flex & Scroll) */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth pb-4 px-1"
          >
            {youtubeVideos.slice(0, 10).map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${encodeURIComponent(String(video.id || ''))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="video-card flex-none w-[240px] sm:w-[260px] md:w-[280px] lg:w-[19%] min-w-[220px] sm:min-w-[240px]"
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

                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-white border-x border-b border-gray-100 rounded-b-lg">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">{video.channel}</p>
                  </div>

                  <div className="mt-2 text-[11px] text-gray-400">
                    <span>{formatViews(video.views)}</span>
                    <span>·</span>
                    <span>{formatDate(video.publish_time)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* 오른쪽 화살표 버튼 */}
          <button 
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-1 lg:right-0 top-1/2 -translate-y-1/2 lg:-mr-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next videos"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

        </div>
      </div>

      {/* 커뮤니티 인기글 섹션 */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">
            커뮤니티 인기글
          </h2>
        </div>

        {/* 커뮤니티 카테고리 탭 */}
        <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
          {COMMUNITY_OPTIONS.map((comm) => (
            <button
              key={comm.value}
              onClick={() => setSelectedComm(comm.value)}
              className={`chip ${selectedComm === comm.value ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {comm.label}
            </button>
          ))}
        </div>

        {/* 게시글 리스트 (그리드 2단 레이아웃) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {communityPosts.length > 0 ? (
            communityPosts.map((post) => (
              <a
                key={post.rank}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group"
              >
                <span className="text-lg font-bold text-blue-600 w-6 text-center">
                  {post.rank}
                </span>
                <div className="flex-1 overflow-hidden">
                  <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
              </a>
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-400 text-sm">
              현재 불러올 수 있는 인기글 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      <SummaryModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        data={selectedKeyword} 
      />

            {/* --- 트렌드 Top 20 모달 추가 --- */}
      {isTrendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  오늘의 트렌드 키워드 
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  오늘의 트렌드 키워드 전체 순위입니다.
                </p>
              </div>
              <button 
                onClick={() => setIsTrendModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 모달 바디 (2단 그리드) */}
            <div className="overflow-y-auto p-6 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                
                {/* 왼쪽 컬럼 (1위 ~ 10위) */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 pl-2">1위 ~ 10위</h4>
                  {risingKeywords.slice(0, 10).map((item) => (
                    <div 
                      key={item.rank}
                      // [수정] 클릭 시 상세분석(navigate) 대신 요약 모달(openModal) 호출
                      onClick={() => {
                        setIsTrendModalOpen(false); // 순위 모달 닫기
                        openModal({ 
                          keyword: item.keyword,
                          rank: item.rank,
                          score: item.score,
                          title: item.keyword,
                          desc: `${item.keyword}에 대한 트렌드 요약입니다.`,
                          type: 'trend'
                        });
                      }}
                      className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold w-6 text-center ${item.rank <= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {item.rank}
                        </span>
                        <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {item.keyword}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.change === '-' ? 'text-gray-300' : 'text-blue-500'}`}>
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 오른쪽 컬럼 (11위 ~ 20위) */}
                <div className="space-y-2 mt-6 md:mt-0">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 pl-2">11위 ~ 20위</h4>
                  {risingKeywords.slice(10, 20).map((item) => (
                    <div 
                      key={item.rank}
                      // [수정] 클릭 시 상세분석(navigate) 대신 요약 모달(openModal) 호출
                      onClick={() => {
                        setIsTrendModalOpen(false); // 순위 모달 닫기
                        openModal({ 
                          keyword: item.keyword,
                          rank: item.rank,
                          score: item.score,
                          title: item.keyword,
                          desc: `${item.keyword}에 대한 트렌드 요약입니다.`,
                          type: 'trend'
                        });
                      }}
                      className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold w-6 text-center text-gray-400">
                          {item.rank}
                        </span>
                        <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                          {item.keyword}
                        </span>
                      </div>
                      <span className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.change === '-' ? 'text-gray-300' : 'text-blue-500'}`}>
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div> // HomePage 끝나는 태그
  );
};

export default HomePage;
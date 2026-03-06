// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// [수정] 더보기를 위한 ChevronDown 아이콘 추가
import { PlayCircle, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Newspaper } from 'lucide-react'; 
import SearchBar from '../components/common/SearchBar';
import SummaryModal from '../components/home/SummaryModal';
import InitialCommunityModal from '../components/home/InitialCommunityModal'; // [추가] 초기 커뮤니티 모달
import { formatViews, formatDate } from '../utils/formatters';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { navigateToAnalysisOnEnter } from '../utils/searchNavigation';
import { Question } from '@phosphor-icons/react'; 

const HomePage = () => {
  const navigate = useNavigate();
  
  // --- 상태 관리 (State) ---
  const [risingKeywords, setRisingKeywords] = useState([]); 
  const [risingPlatforms, setRisingPlatforms] = useState([]); 
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  
  // 툴팁 통합 상태 ('trend', 'platform', 'news', null)
  const [activeTooltip, setActiveTooltip] = useState(null);

  const toggleTooltip = (type) => {
    setActiveTooltip(prev => prev === type ? null : type);
  };

  // [뉴스 키워드 (상단)]
  const [newsKeywords, setNewsKeywords] = useState([]);
  const [selectedNewsTopCategory, setSelectedNewsTopCategory] = useState('korea'); // 상단 뉴스 카테고리 상태
  const [isNewsDropdownOpen, setIsNewsDropdownOpen] = useState(false); // 상단 뉴스 드롭다운 상태

  // [유튜브]
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeCategory, setYoutubeCategory] = useState('전체');
  
  // [UI 상태]
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName] = useState(() => getStoredUser()?.nickname || '사용자');
  
  // [모달 상태]
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);
  const [isInitialModalOpen, setIsInitialModalOpen] = useState(false); // [추가] 최초 진입 모달 상태

  // [커뮤니티 상태 (하단)]
  const [communityPosts, setCommunityPosts] = useState([]);
  const [selectedComm, setSelectedComm] = useState('theqoo');
  const [visibleCommunityCount, setVisibleCommunityCount] = useState(5); // [추가] 커뮤니티 더보기 카운트

  // [뉴스 상태 (하단)]
  const [selectedNewsCategory, setSelectedNewsCategory] = useState('korea');
  const [todayNews, setTodayNews] = useState([]);
  const [visibleNewsCount, setVisibleNewsCount] = useState(5); // [추가] 뉴스 더보기 카운트

  // 읽음 처리 상태
  const [readLinks, setReadLinks] = useState(() => {
    const savedLinks = localStorage.getItem('readCommunityLinks');
    return savedLinks ? new Set(JSON.parse(savedLinks)) : new Set();
  });

  const [readNewsLinks, setReadNewsLinks] = useState(() => {
    const savedNewsLinks = localStorage.getItem('readNewsLinks');
    return savedNewsLinks ? new Set(JSON.parse(savedNewsLinks)) : new Set();
  });

  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- 상수 정의 ---
  const COMMUNITY_OPTIONS = [
    { label: '더쿠', value: 'theqoo' },
    { label: '디시인사이드', value: 'dcinside' },
    { label: '루리웹', value: 'ruliweb' },
    { label: '네이트판', value: 'natepan' },
    { label: 'FM코리아', value: 'fmkorea' },
  ];

  const NEWS_CATEGORY_OPTIONS = [
    { label: '대한민국', value: 'korea' },
    { label: '세계', value: 'world' },
    { label: '비즈니스', value: 'business' },
    { label: '과학/기술', value: 'tech' },
    { label: '엔터테인먼트', value: 'entertainment' },
    { label: '스포츠', value: 'sports' },
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

  // --- 핸들러 함수 ---
  const handleSearch = (e) => {
    navigateToAnalysisOnEnter({ event: e, keyword: searchTerm, navigate });
  };

  const openModal = (data) => {
    setSelectedKeyword(data);
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handlePostClick = (link) => {
    setReadLinks((prev) => {
      const newSet = new Set(prev).add(link);
      localStorage.setItem('readCommunityLinks', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const handleNewsClick = (link) => {
    setReadNewsLinks((prev) => {
      const newSet = new Set(prev).add(link);
      localStorage.setItem('readNewsLinks', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const getCategoryBadgeClass = (category) => 'bg-blue-100 text-blue-700';

  // [추가] 초기 모달 제출 핸들러
  const handleInitialCommunitySubmit = (communityValue) => {
    if (communityValue !== 'skip') {
      setSelectedComm(communityValue);
    }
    localStorage.setItem('hasSelectedCommunity', 'true');
    setIsInitialModalOpen(false);
  };

  // --- API 호출 (useEffect) ---

  // [최초 로드 시] 모달 오픈 여부 체크
  useEffect(() => {
    const hasSelected = localStorage.getItem('hasSelectedCommunity');
    if (!hasSelected) {
      setIsInitialModalOpen(true);
    }
  }, []);

  // [탭 변경 시] 더보기 카운트 초기화
  useEffect(() => setVisibleCommunityCount(5), [selectedComm]);
  useEffect(() => setVisibleNewsCount(5), [selectedNewsCategory]);

  // 1. 트렌드/플랫폼/유튜브 데이터
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendRes = await apiClient.get('/trends/rising');
        setRisingKeywords(trendRes.data || []);

        const platformRes = await apiClient.get('/trends/platform', {
          params: { platform: String(selectedPlatform || '') },
        });
        setRisingPlatforms(platformRes.data || []);

        const videoRes = await apiClient.get('/videos', {
          params: { category: String(youtubeCategory || '') },
        });
        setYoutubeVideos(videoRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [selectedPlatform, youtubeCategory]);

  // 2. 상단 뉴스 키워드 데이터 (카테고리 연동)
  useEffect(() => {
    const fetchNewsKeywords = async () => {
      try {
        const res = await apiClient.get('/news/keywords', {
          params: { category: selectedNewsTopCategory }
        });
        setNewsKeywords(res.data || []);
      } catch (error) {
        console.error('뉴스 키워드 로드 실패:', error);
      }
    };
    fetchNewsKeywords();
  }, [selectedNewsTopCategory]);

  // 3. 하단 뉴스 데이터
  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        const res = await apiClient.get('/news/category', { 
          params: { category: selectedNewsCategory } 
        });
        setTodayNews(res.data || []);
      } catch (error) {
        console.error('뉴스 데이터 로드 에러:', error);
      }
    };
    fetchNewsData();
  }, [selectedNewsCategory]);

  // 4. 커뮤니티 데이터
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        const res = await apiClient.get('/community/posts', {
          params: { platform: String(selectedComm || '') },
        });
        setCommunityPosts(res.data || []);
      } catch (error) {
        console.error('커뮤니티 인기글 로드 에러:', error);
      }
    };
    fetchCommunityPosts();
  }, [selectedComm]);


  // --- 렌더링 ---
  return (
    <div 
      className="page"
      onClick={() => {
        if (isDropdownOpen) setIsDropdownOpen(false);
        if (isNewsDropdownOpen) setIsNewsDropdownOpen(false);
      }}
    >
      
      {/* 검색창 헤더 */}
      <div className="flex justify-between items-start mb-6">
        <SearchBar 
          placeholder="관심있는 키워드나 주제를 검색해보세요..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          containerClassName="w-full"
        />  
      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">안녕하세요, {userName}님 </h1>

      {/* 상단 3분할 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        
        {/* 1. 오늘의 트렌드 키워드 */}
        <div className="card-soft">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100">
            <div className="flex items-center gap-1 relative">
              <h2 className="text-lg font-bold text-gray-900">
                오늘의 트렌드 키워드 Top 5
              </h2>
              <button onClick={() => toggleTooltip('trend')} className="text-gray-400 hover:text-indigo-500 transition-colors p-1">
                <Question size={18} weight="fill" />
              </button>
              {activeTooltip === 'trend' && (
                <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in">
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                  <p className="font-semibold mb-1">트렌드 키워드란?</p>
                  <p className="opacity-90 leading-relaxed">최근 검색량, 언급량, 확산도를 종합적으로 분석하여 산출된 순위입니다.</p>
                </div>
              )}
            </div>
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
                  keyword: item.keyword, rank: item.rank, score: item.score,
                  title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type: 'trend'
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

        {/* 2. 오늘의 플랫폼별 키워드 */}
        <div className="card-soft relative">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100">
            <div className="flex items-center gap-1 relative">
              <h2 className="text-lg font-bold text-gray-900">
                오늘의 플랫폼별 키워드 Top 5
              </h2>
              <button onClick={() => toggleTooltip('platform')} className="text-gray-400 hover:text-indigo-500 transition-colors p-1">
                <Question size={18} weight="fill" />
              </button>
              {activeTooltip === 'platform' && (
                <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in">
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                  <p className="font-semibold mb-1">플랫폼 트렌드란?</p>
                  <p className="opacity-90 leading-relaxed">선택된 플랫폼 내에서의 최근 언급량과 반응 급상승 폭을 기준으로 산출된 순위입니다.</p>
                </div>
              )}
            </div>
            <div className="tab-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`tab-btn flex items-center gap-1 ${
                    isDropdownOpen || selectedPlatform ? 'tab-active text-green-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="font-medium text-xs">
                    {MAIN_PLATFORM_OPTIONS.find(opt => opt.value === selectedPlatform)?.label || '커뮤니티'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                    {MAIN_PLATFORM_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSelectedPlatform(option.value); setIsDropdownOpen(false); }}
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
                  keyword: item.keyword, rank: index +1, score: item.count,
                  title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type : 'platform'
                })}
                className="flex items-center gap-4 text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12"
              >
                <span className="font-bold text-blue-600 w-3 text-center">{item.rank || index + 1 }</span>
                <span className="font-medium text-gray-900 whitespace-nowrap">{item.keyword}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. 오늘의 뉴스 키워드 */}
        <div className="card-soft relative">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100">
            <div className="flex items-center gap-1 relative">
              <h2 className="text-lg font-bold text-gray-900">
                오늘의 뉴스 키워드 Top 5
              </h2>
              <button onClick={() => toggleTooltip('news')} className="text-gray-400 hover:text-indigo-500 transition-colors p-1">
                <Question size={18} weight="fill" />
              </button>
              {activeTooltip === 'news' && (
                <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in">
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                  <p className="font-semibold mb-1">뉴스 키워드란?</p>
                  <p className="opacity-90 leading-relaxed">주요 언론사 기사에서 언급된 빈도와 사회적 주목도를 종합적으로 분석하여 산출된 순위입니다.</p>
                </div>
              )}
            </div>

            {/* [추가] 뉴스 키워드 드롭다운 */}
            <div className="tab-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <button
                  onClick={() => setIsNewsDropdownOpen(!isNewsDropdownOpen)}
                  className={`tab-btn flex items-center gap-1 ${
                    isNewsDropdownOpen || selectedNewsTopCategory ? 'tab-active text-emerald-600' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="font-medium text-xs">
                    {NEWS_CATEGORY_OPTIONS.find(opt => opt.value === selectedNewsTopCategory)?.label || '대한민국'}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isNewsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isNewsDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                    {NEWS_CATEGORY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => { setSelectedNewsTopCategory(option.value); setIsNewsDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                          selectedNewsTopCategory === option.value ? 'text-emerald-600 font-bold bg-emerald-50' : 'text-gray-600'
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
            {newsKeywords.length > 0 ? (
                newsKeywords.slice(0, 5).map((item, index) => (
                <li 
                    key={index} 
                    onClick={() => {
                        const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(item.keyword)}&hl=ko&gl=KR&ceid=KR%3Ako`;
                        window.open(searchUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12"
                >
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-emerald-600 w-3 text-center">{item.rank}</span>
                      <p className="font-medium text-gray-900">{item.keyword}</p>
                    </div>
                </li>
                ))
            ) : (
                <li className="text-center text-gray-400 text-xs py-10">데이터를 불러오는 중입니다.</li>
            )}
          </ul>
        </div>
      </div>

      {/* 유튜브 섹션 */}
      <div className="mb-8 relative group"> 
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">유튜브 일일 급상승 동영상</h2>
        </div>
        <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat} onClick={() => setYoutubeCategory(cat)}
              className={`chip ${youtubeCategory === cat ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <button onClick={() => scroll('left')} className="hidden sm:flex absolute left-1 lg:left-0 top-1/2 -translate-y-1/2 lg:-ml-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100" aria-label="Previous videos">
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div ref={scrollRef} className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth pb-4 px-1">
            {youtubeVideos.slice(0, 10).map((video) => (
              <a key={video.id} href={`https://www.youtube.com/watch?v=${encodeURIComponent(String(video.id || ''))}`} target="_blank" rel="noopener noreferrer" className="video-card flex-none w-[240px] sm:w-[260px] md:w-[280px] lg:w-[19%] min-w-[220px] sm:min-w-[240px]">
                <div className="relative w-full aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-10 h-10 drop-shadow-lg" />
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-white border-x border-b border-gray-100 rounded-b-lg">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">{video.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{video.channel}</p>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400">
                    <span>{formatViews(video.views)}</span><span>·</span><span>{formatDate(video.publish_time)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <button onClick={() => scroll('right')} className="hidden sm:flex absolute right-1 lg:right-0 top-1/2 -translate-y-1/2 lg:-mr-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100" aria-label="Next videos">
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 하단 2분할 섹션 */}
      <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 왼쪽: 커뮤니티 인기글 */}
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">커뮤니티 인기글</h2>
          </div>
          <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
            {COMMUNITY_OPTIONS.map((comm) => (
              <button
                key={comm.value} onClick={() => setSelectedComm(comm.value)}
                className={`chip ${selectedComm === comm.value ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {comm.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {communityPosts.length > 0 ? (
              <>
                {/* [수정] 5개까지만 노출 (더보기 클릭 시 전체 노출) */}
                {communityPosts.slice(0, visibleCommunityCount).map((post) => {
                  const isRead = readLinks.has(post.link);
                  return (
                    <a
                      key={post.rank} href={post.link} target="_blank" rel="noopener noreferrer"
                      onClick={() => handlePostClick(post.link)}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group"
                    >
                      <div className="flex-1 overflow-hidden flex items-center gap-2">
                        {post.category && (
                          <span className={`shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-md ${getCategoryBadgeClass(post.category)}`}>
                            {post.category}
                          </span>
                        )}
                        <h3 className={`text-sm truncate transition-colors ${isRead ? 'text-gray-400 font-normal' : 'text-gray-800 font-medium group-hover:text-blue-600'}`}>
                          {post.title}
                        </h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                    </a>
                  );
                })}
                {/* [추가] 숨겨진 데이터가 있을 때 더보기 버튼 표시 */}
                {communityPosts.length > visibleCommunityCount && (
                  <button 
                    onClick={() => setVisibleCommunityCount(communityPosts.length)}
                    className="w-full mt-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium rounded-xl text-sm transition-colors border border-gray-100 flex items-center justify-center gap-1"
                  >
                    더보기 <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                현재 불러올 수 있는 인기글 데이터가 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽: 오늘의 뉴스 */}
        <div>
          <div className="flex justify-between items-end mb-4 h-[34px]"> 
            <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1 flex items-center gap-2">오늘의 뉴스</h2>
          </div>
          <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
            {NEWS_CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value} onClick={() => setSelectedNewsCategory(cat.value)}
                className={`chip ${selectedNewsCategory === cat.value ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {todayNews.length > 0 ? (
              <>
                {/* [수정] 5개까지만 노출 (더보기 클릭 시 전체 노출) */}
                {todayNews.slice(0, visibleNewsCount).map((news, idx) => {
                  const isRead = readNewsLinks.has(news.link);
                  return (
                    <a
                      key={idx} href={news.link} target="_blank" rel="noopener noreferrer"
                      onClick={() => handleNewsClick(news.link)}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group"
                    >
                      <div className="flex-1 overflow-hidden">
                        <h3 className={`text-sm truncate transition-colors ${isRead ? 'text-gray-400 font-normal' : 'text-gray-800 font-medium group-hover:text-emerald-600'}`}>
                          {news.title}
                        </h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                    </a>
                  );
                })}
                {/* [추가] 숨겨진 데이터가 있을 때 더보기 버튼 표시 */}
                {todayNews.length > visibleNewsCount && (
                  <button 
                    onClick={() => setVisibleNewsCount(todayNews.length)}
                    className="w-full mt-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium rounded-xl text-sm transition-colors border border-gray-100 flex items-center justify-center gap-1"
                  >
                    더보기 <ChevronDown className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                뉴스 데이터를 불러오는 중입니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 요약 모달 */}
      <SummaryModal isOpen={isModalOpen} onClose={closeModal} data={selectedKeyword} />

      {/* 트렌드 Top 20 모달 */}
      {isTrendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">오늘의 트렌드 키워드</h3>
                <p className="text-sm text-gray-500 mt-1">오늘의 트렌드 키워드 전체 순위입니다.</p>
              </div>
              <button onClick={() => setIsTrendModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 pl-2">1위 ~ 10위</h4>
                  {risingKeywords.slice(0, 10).map((item) => (
                    <div 
                      key={item.rank}
                      onClick={() => { setIsTrendModalOpen(false); openModal({ keyword: item.keyword, rank: item.rank, score: item.score, title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type: 'trend' }); }}
                      className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-bold w-6 text-center ${item.rank <= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>{item.rank}</span>
                        <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{item.keyword}</span>
                      </div>
                      <span className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.change === '-' ? 'text-gray-300' : 'text-blue-500'}`}>{item.change}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-6 md:mt-0">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 pl-2">11위 ~ 20위</h4>
                  {risingKeywords.slice(10, 20).map((item) => (
                    <div 
                      key={item.rank}
                      onClick={() => { setIsTrendModalOpen(false); openModal({ keyword: item.keyword, rank: item.rank, score: item.score, title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type: 'trend' }); }}
                      className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold w-6 text-center text-gray-400">{item.rank}</span>
                        <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{item.keyword}</span>
                      </div>
                      <span className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.change === '-' ? 'text-gray-300' : 'text-blue-500'}`}>{item.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

            {/* 개발용 임시 버튼 (나중에 지우세요!) */}
      <button 
        onClick={() => {
          localStorage.removeItem('hasSelectedCommunity'); // 저장된 기록 삭제
          setIsInitialModalOpen(true); // 모달 바로 열기
        }}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg z-50 text-xs"
      >
        모달 테스트 열기
      </button>

      {/* [추가] 최초 로그인 시 커뮤니티 선택 모달 */}
      <InitialCommunityModal 
        isOpen={isInitialModalOpen} 
        onSubmit={handleInitialCommunitySubmit} 
      />

    </div>
  );
};

export default HomePage;
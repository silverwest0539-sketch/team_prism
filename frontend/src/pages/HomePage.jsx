// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, X, Newspaper } from 'lucide-react';  
import SearchBar from '../components/common/SearchBar';
import SummaryModal from '../components/home/SummaryModal';
import InitialWizardModal from '../components/home/InitialWizardModal';
import { formatViews, formatDate } from '../utils/formatters';
import apiClient from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { navigateToAnalysisOnEnter } from '../utils/searchNavigation';
import { Question } from '@phosphor-icons/react'; 

const HomePage = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const userInfo = storedUser;
  
  const [risingKeywords, setRisingKeywords] = useState([]); 
  const [risingPlatforms, setRisingPlatforms] = useState([]); 
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');
  
  // 툴팁 관련 상태 분리 (호버 상태 vs 클릭 고정 상태)
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [pinnedTooltip, setPinnedTooltip] = useState(null);
  const isTooltipVisible = (type) => hoveredTooltip === type || pinnedTooltip === type;

  const [newsKeywords, setNewsKeywords] = useState([]);
  const [selectedNewsTopCategory, setSelectedNewsTopCategory] = useState('korea');
  const [isNewsDropdownOpen, setIsNewsDropdownOpen] = useState(false);

  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeCategory, setYoutubeCategory] = useState('전체');
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName] = useState(() => storedUser?.nickname || '사용자');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);
  const [isInitialModalOpen, setIsInitialModalOpen] = useState(false); 

  const [communityPosts, setCommunityPosts] = useState([]);
  const [selectedComm, setSelectedComm] = useState('theqoo'); 
  const [visibleCommunityCount, setVisibleCommunityCount] = useState(5); 

  const [selectedNewsCategory, setSelectedNewsCategory] = useState('korea');
  const [todayNews, setTodayNews] = useState([]);
  const [visibleNewsCount, setVisibleNewsCount] = useState(5); 

  const [readLinks, setReadLinks] = useState(new Set());
  const [readNewsLinks, setReadNewsLinks] = useState(new Set());

  const scrollRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const COMMUNITY_OPTIONS = [
    { label: '더쿠', value: 'theqoo' },
    { label: '디시인사이드', value: 'dcinside' },
    { label: '루리웹', value: 'ruliweb' },
    { label: '인스티즈', value: 'instiz' },
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
    { label: '인스티즈', value: 'instiz' },
    { label: 'FM코리아', value: 'fmkorea' },
  ];

  const CATEGORY_TABS = ['전체', '음악', '엔터테인먼트', '게임', '뉴스', '스포츠', '브이로그'];

  const handleSearch = (e) => navigateToAnalysisOnEnter({ event: e, keyword: searchTerm, navigate });
  const openModal = (data) => { setSelectedKeyword(data); setIsModalOpen(true); };
  const closeModal = () => setIsModalOpen(false);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      current.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const handlePostClick = (link) => setReadLinks((prev) => new Set(prev).add(link));
  const handleNewsClick = (link) => setReadNewsLinks((prev) => new Set(prev).add(link));
  const getCategoryBadgeClass = () => 'bg-blue-100 text-blue-700';

  const handleInitialPreferencesSubmit = async ({ community, news }) => {
    if (community && community !== 'skip') {
      setSelectedPlatform(community); 
      setSelectedComm(community === 'youtube' ? 'theqoo' : community);
    } else {
      setSelectedPlatform('youtube');
      setSelectedComm('theqoo'); 
    }
    
    if (news && news !== 'skip') {
      setSelectedNewsTopCategory(news);
      setSelectedNewsCategory(news);
    }

    try {
      if (userInfo?.email) {
        await apiClient.post('/auth/update-preference', { 
          email: userInfo.email,
          preferredCommunity: community === 'skip' ? '' : community,
          preferredNews: news === 'skip' ? '' : news 
        });
      }
    } catch (error) {
      console.error('취향 설정 저장 실패:', error);
    }
    
    localStorage.setItem(`hasSeenWizard_${userInfo?.email}`, 'true');
    setIsInitialModalOpen(false);
  };

  useEffect(() => setVisibleCommunityCount(5), [selectedComm]);
  useEffect(() => setVisibleNewsCount(5), [selectedNewsCategory]);

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
      } catch (error) { console.error(error); }
    };
    fetchData();
  }, [selectedPlatform, youtubeCategory]);

  useEffect(() => {
    const fetchNewsKeywords = async () => {
      try {
        const res = await apiClient.get('/news/keywords', { params: { category: selectedNewsTopCategory } });
        setNewsKeywords(res.data || []);
      } catch (error) { console.error(error); }
    };
    fetchNewsKeywords();
  }, [selectedNewsTopCategory]);

  useEffect(() => {
    const fetchNewsData = async () => {
      try {
        const res = await apiClient.get('/news/category', { params: { category: selectedNewsCategory } });
        setTodayNews(res.data || []);
      } catch (error) { console.error(error); }
    };
    fetchNewsData();
  }, [selectedNewsCategory]);

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        const res = await apiClient.get('/community/posts', {
          params: { platform: selectedComm },
        });
        setCommunityPosts(res.data || []);
      } catch (error) {
        console.error('커뮤니티 인기글 로드 에러:', error);
        setCommunityPosts([]);
      }
    };
    fetchCommunityPosts();
  }, [selectedComm]);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (userInfo?.email) {
        try {
          const res = await apiClient.get('/auth/preferences', { params: { email: userInfo.email } });
          if (res.data.success) {
            const { preferredCommunity, preferredNews } = res.data;
            const hasSeenWizard = localStorage.getItem(`hasSeenWizard_${userInfo.email}`);

            if (!hasSeenWizard && (!preferredCommunity || !preferredNews)) {
              setIsInitialModalOpen(true);
            } else {
              setSelectedPlatform(preferredCommunity || 'youtube');
              setSelectedComm((preferredCommunity === 'youtube' || !preferredCommunity) ? 'theqoo' : preferredCommunity);
              setSelectedNewsTopCategory(preferredNews || 'korea');
              setSelectedNewsCategory(preferredNews || 'korea');
            }
          }
        } catch (error) {
          console.error(error);
        }
      } 
    };
    fetchUserPreferences();
  }, [userInfo?.email]);

  return (
    // 여백(배경) 클릭 시 드롭다운 메뉴 및 고정된 툴팁 닫힘 처리
    <div className="page" onClick={() => { setIsDropdownOpen(false); setIsNewsDropdownOpen(false); setPinnedTooltip(null); }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        
        {/* 1. 트렌드 키워드 */}
        <div className="card-soft">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b pb-2 border-gray-100">
            <div className="flex items-center gap-1 relative">
              <h2 className="text-base xl:text-lg font-bold text-gray-900 break-keep">오늘의 트렌드 키워드</h2>
              <button 
                onMouseEnter={() => setHoveredTooltip('trend')}
                onMouseLeave={() => setHoveredTooltip(null)}
                onClick={(e) => { e.stopPropagation(); setPinnedTooltip(prev => prev === 'trend' ? null : 'trend'); }}
                className={`transition-colors p-1 ${pinnedTooltip === 'trend' ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
              >
                <Question size={18} weight="fill" />
              </button>
              {isTooltipVisible('trend') && (
                <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in pointer-events-none">
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                  <p className="font-semibold mb-1">트렌드 키워드란?</p>
                  <p className="opacity-90 leading-relaxed">최근 검색량, 언급량, 확산도를 종합적으로 분석하여 산출된 순위입니다.</p>
                </div>
              )}
            </div>
            <button onClick={() => setIsTrendModalOpen(true)} className="text-xs text-gray-400 hover:text-indigo-600 font-medium flex items-center gap-1 ml-auto">
              더보기 <Plus size={12} />
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {risingKeywords.slice(0, 5).map((item, index) => (
              <li key={index} onClick={() => openModal({ keyword: item.keyword, rank: item.rank, score: item.score, title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type: 'trend' })} className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12">
                <div className="flex items-center gap-4"><span className="font-bold text-blue-600 w-3 text-center">{item.rank}</span><p className="font-medium text-gray-900">{item.keyword}</p></div>
                <div className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.isUp === false ? 'text-blue-500' : 'text-gray-400'}`}>{item.change}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* 2. 플랫폼별 키워드 */}
        <div className="card-soft relative">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b pb-2 border-gray-100">
            <div className="flex items-center gap-1 relative">
              <h2 className="text-base xl:text-lg font-bold text-gray-900 break-keep">오늘의 플랫폼별 키워드</h2>
              <button 
                onMouseEnter={() => setHoveredTooltip('platform')}
                onMouseLeave={() => setHoveredTooltip(null)}
                onClick={(e) => { e.stopPropagation(); setPinnedTooltip(prev => prev === 'platform' ? null : 'platform'); }}
                className={`transition-colors p-1 ${pinnedTooltip === 'platform' ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
              >
                <Question size={18} weight="fill" />
              </button>
              {isTooltipVisible('platform') && (
                <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in pointer-events-none">
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                  <p className="font-semibold mb-1">플랫폼 트렌드란?</p>
                  <p className="opacity-90 leading-relaxed">선택된 플랫폼 내에서의 최근 언급량과 반응 급상승 폭을 기준으로 산출된 순위입니다.</p>
                </div>
              )}
            </div>
            <div className="tab-wrap ml-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`tab-btn flex items-center gap-1 ${isDropdownOpen || selectedPlatform ? 'tab-active text-green-600' : 'text-gray-500 hover:text-gray-800'}`}>
                  <span className="font-medium text-xs">{MAIN_PLATFORM_OPTIONS.find(opt => opt.value === selectedPlatform)?.label || '유튜브'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                    {MAIN_PLATFORM_OPTIONS.map((option) => (
                      <button key={option.value} onClick={() => { setSelectedPlatform(option.value); setIsDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${selectedPlatform === option.value ? 'text-green-600 font-bold bg-green-50' : 'text-gray-600'}`}>
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
              <li key={index} onClick={() => openModal({ keyword: item.keyword, rank: index +1, score: item.count, title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type : 'platform' })} className="flex items-center gap-4 text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12">
                <span className="font-bold text-blue-600 w-3 text-center">{item.rank || index + 1 }</span><span className="font-medium text-gray-900 whitespace-nowrap">{item.keyword}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. 뉴스 키워드 */}
        <div className="card-soft relative">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b pb-2 border-gray-100">
            <div className="flex items-center gap-1 relative">
              <h2 className="text-base xl:text-lg font-bold text-gray-900 break-keep">오늘의 뉴스 키워드</h2>
              <button 
                onMouseEnter={() => setHoveredTooltip('news')}
                onMouseLeave={() => setHoveredTooltip(null)}
                onClick={(e) => { e.stopPropagation(); setPinnedTooltip(prev => prev === 'news' ? null : 'news'); }}
                className={`transition-colors p-1 ${pinnedTooltip === 'news' ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-500'}`}
              >
                <Question size={18} weight="fill" />
              </button>
              {isTooltipVisible('news') && (
                <div className="absolute top-8 left-0 z-50 w-64 p-3 bg-gray-800 text-white text-xs rounded-xl shadow-xl animate-fade-in pointer-events-none">
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-800 transform rotate-45"></div>
                  <p className="font-semibold mb-1">뉴스 키워드란?</p>
                  <p className="opacity-90 leading-relaxed">주요 언론사 기사에서 언급된 빈도와 사회적 주목도를 종합적으로 분석하여 산출된 순위입니다.</p>
                </div>
              )}
            </div>
            <div className="tab-wrap ml-auto" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <button onClick={() => setIsNewsDropdownOpen(!isNewsDropdownOpen)} className={`tab-btn flex items-center gap-1 ${isNewsDropdownOpen || selectedNewsTopCategory ? 'tab-active text-emerald-600' : 'text-gray-500 hover:text-gray-800'}`}>
                  <span className="font-medium text-xs">{NEWS_CATEGORY_OPTIONS.find(opt => opt.value === selectedNewsTopCategory)?.label || '대한민국'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isNewsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isNewsDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1 z-50">
                    {NEWS_CATEGORY_OPTIONS.map((option) => (
                      <button key={option.value} onClick={() => { setSelectedNewsTopCategory(option.value); setIsNewsDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${selectedNewsTopCategory === option.value ? 'text-emerald-600 font-bold bg-emerald-50' : 'text-gray-600'}`}>
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
                <li key={index} onClick={() => { window.open(`https://news.google.com/search?q=${encodeURIComponent(item.keyword)}&hl=ko&gl=KR&ceid=KR%3Ako`, '_blank', 'noopener,noreferrer'); }} className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 px-2 rounded-lg transition-colors h-12">
                    <div className="flex items-center gap-4"><span className="font-bold text-emerald-600 w-3 text-center">{item.rank}</span><p className="font-medium text-gray-900">{item.keyword}</p></div>
                </li>
                ))
            ) : ( <li className="text-center text-gray-400 text-xs py-10">데이터를 불러오는 중입니다.</li> )}
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
            <button key={cat} onClick={() => setYoutubeCategory(cat)} className={`chip ${youtubeCategory === cat ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
          ))}
        </div>
        <div className="relative">
          {/* 전체 영역(.group) 호버 시 보이는 스크롤 버튼들 */}
          <button onClick={() => scroll('left')} className="hidden sm:flex absolute left-1 lg:left-0 top-1/2 -translate-y-1/2 lg:-ml-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100" aria-label="Previous videos"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
          
          <div ref={scrollRef} className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth pb-4 px-1">
            {youtubeVideos.slice(0, 10).map((video) => (
              /* 개별 카드 호버 개선: group/item 추가 및 hover 속성 세분화 */
              <a 
                key={video.id} 
                href={`https://www.youtube.com/watch?v=${encodeURIComponent(String(video.id || ''))}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="video-card flex-none w-[240px] sm:w-[260px] md:w-[280px] lg:w-[19%] min-w-[220px] sm:min-w-[240px] group/item hover:-translate-y-1 transition-transform duration-300 rounded-b-lg hover:shadow-lg"
              >
                <div className="relative w-full aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <PlayCircle className="text-white w-12 h-12 drop-shadow-lg" />
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-white border-x border-b border-gray-100 rounded-b-lg group-hover/item:border-gray-200 transition-colors">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover/item:text-blue-600 transition-colors">{video.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{video.channel}</p>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1">
                    <span>{formatViews(video.views)}</span><span>·</span><span>{formatDate(video.publish_time)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          
          <button onClick={() => scroll('right')} className="hidden sm:flex absolute right-1 lg:right-0 top-1/2 -translate-y-1/2 lg:-mr-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100" aria-label="Next videos"><ChevronRight className="w-6 h-6 text-gray-600" /></button>
        </div>
      </div>

      {/* 하단 2분할 섹션 */}
      <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-end mb-4">
            <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">커뮤니티 인기글</h2>
          </div>
          <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
            {COMMUNITY_OPTIONS.map((comm) => (
              <button key={comm.value} onClick={() => setSelectedComm(comm.value)} className={`chip ${selectedComm === comm.value ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {comm.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {communityPosts.length > 0 ? (
              <>
                {communityPosts.slice(0, visibleCommunityCount).map((post, idx) => {
                  const isRead = readLinks.has(post.link);
                  return (
                    <a key={`${post.rank}-${idx}`} href={post.link} target="_blank" rel="noopener noreferrer" onClick={() => handlePostClick(post.link)} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                      <div className="flex-1 overflow-hidden flex items-center gap-2">
                        {post.category && <span className={`shrink-0 px-2 py-0.5 text-[11px] font-bold rounded-md ${getCategoryBadgeClass(post.category)}`}>{post.category}</span>}
                        <h3 className={`text-sm truncate transition-colors ${isRead ? 'text-gray-400 font-normal' : 'text-gray-800 font-medium group-hover:text-blue-600'}`}>{post.title}</h3>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                    </a>
                  );
                })}
                {communityPosts.length > 5 && (
                  <button onClick={() => setVisibleCommunityCount(prev => prev === 5 ? communityPosts.length : 5)} className="w-full mt-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium rounded-xl text-sm transition-colors border border-gray-100 flex items-center justify-center gap-1">
                    {visibleCommunityCount === 5 ? <><>더보기</> <ChevronDown className="w-4 h-4" /></> : <><>접기</> <ChevronUp className="w-4 h-4" /></>}
                  </button>
                )}
              </>
            ) : ( <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">현재 불러올 수 있는 인기글 데이터가 없습니다.</div> )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-4 h-[34px]"> 
            <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1 flex items-center gap-2">오늘의 뉴스</h2>
          </div>
          <div className="scroll-x scrollbar-hide flex gap-2 mb-6">
            {NEWS_CATEGORY_OPTIONS.map((cat) => (
              <button key={cat.value} onClick={() => setSelectedNewsCategory(cat.value)} className={`chip ${selectedNewsCategory === cat.value ? 'chip-active' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {todayNews.length > 0 ? (
              <>
                {todayNews.slice(0, visibleNewsCount).map((news, idx) => {
                  const isRead = readNewsLinks.has(news.link);
                  return (
                    <a key={idx} href={news.link} target="_blank" rel="noopener noreferrer" onClick={() => handleNewsClick(news.link)} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all group">
                      <div className="flex-1 overflow-hidden"><h3 className={`text-sm truncate transition-colors ${isRead ? 'text-gray-400 font-normal' : 'text-gray-800 font-medium group-hover:text-emerald-600'}`}>{news.title}</h3></div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                    </a>
                  );
                })}
                {todayNews.length > 5 && (
                  <button onClick={() => setVisibleNewsCount(prev => prev === 5 ? todayNews.length : 5)} className="w-full mt-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium rounded-xl text-sm transition-colors border border-gray-100 flex items-center justify-center gap-1">
                    {visibleNewsCount === 5 ? <><>더보기</> <ChevronDown className="w-4 h-4" /></> : <><>접기</> <ChevronUp className="w-4 h-4" /></>}
                  </button>
                )}
              </>
            ) : ( <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">뉴스 데이터를 불러오는 중입니다.</div> )}
          </div>
        </div>
      </div>

      <SummaryModal isOpen={isModalOpen} onClose={closeModal} data={selectedKeyword} />

      {isTrendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">오늘의 트렌드 키워드</h3>
                <p className="text-sm text-gray-500 mt-1">오늘의 트렌드 키워 전체 순위입니다.</p>
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
                    <div key={item.rank} onClick={() => { setIsTrendModalOpen(false); openModal({ keyword: item.keyword, rank: item.rank, score: item.score, title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type: 'trend' }); }} className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-4"><span className={`text-lg font-bold w-6 text-center ${item.rank <= 3 ? 'text-indigo-600' : 'text-gray-500'}`}>{item.rank}</span><span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{item.keyword}</span></div>
                      <span className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.change === '-' ? 'text-gray-300' : 'text-blue-500'}`}>{item.change}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 mt-6 md:mt-0">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 pl-2">11위 ~ 20위</h4>
                  {risingKeywords.slice(10, 20).map((item) => (
                    <div key={item.rank} onClick={() => { setIsTrendModalOpen(false); openModal({ keyword: item.keyword, rank: item.rank, score: item.score, title: item.keyword, desc: `${item.keyword}에 대한 트렌드 요약입니다.`, type: 'trend' }); }} className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center gap-4"><span className="text-lg font-bold w-6 text-center text-gray-400">{item.rank}</span><span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{item.keyword}</span></div>
                      <span className={`text-xs font-bold ${item.isUp ? 'text-red-500' : item.change === '-' ? 'text-gray-300' : 'text-blue-500'}`}>{item.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <InitialWizardModal isOpen={isInitialModalOpen} onComplete={handleInitialPreferencesSubmit} />
    </div>
  );
};

export default HomePage;
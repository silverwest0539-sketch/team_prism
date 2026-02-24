// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import { PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchBar from '../components/common/SearchBar';
import HeaderActions from '../components/common/HeaderActions';
import SummaryModal from '../components/home/SummaryModal';
import { formatViews, formatDate } from '../utils/formatters';
import { toApiUrl } from '../utils/apiClient';
import { getStoredUser } from '../utils/authStorage';
import { navigateToAnalysisOnEnter } from '../utils/searchNavigation';
import { Star } from '@phosphor-icons/react';

const HomePage = () => {
  const navigate = useNavigate();
  
  // ?곹깭 愿由?
  const [risingKeywords, setRisingKeywords] = useState([]); 
  const [risingPlatforms, setRisingPlatforms] = useState([]); 
  const [selectedPlatform, setSelectedPlatform] = useState('youtube'); 
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeCategory, setYoutubeCategory] = useState('전체');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  
  // 紐⑤떖 ?곹깭
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [selectedComm, setSelectedComm] = useState('theqoo');

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
    { label: 'X (트위터)', value: 'x' },
  ];

  const CATEGORY_TABS = ['전체', '음악', '엔터테인먼트', '게임', '뉴스', '스포츠', '브이로그', '챌린지'];

  const openModal = (data) => {
    setSelectedKeyword(data);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // ?ㅽ겕濡??몃뱾???⑥닔
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      // ??踰??대┃ ???대룞??嫄곕━ (??移대뱶 1~2媛??덈퉬 + gap)
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // API ?몄텧
  useEffect(() => {
      const fetchData = async () => {
        try {
          // 1. 湲됱긽???ㅼ썙??濡쒕뱶 (湲곗〈 ?좎?)
          const trendRes = await fetch(toApiUrl('/trends/rising'));
          const trendData = await trendRes.json();
          setRisingKeywords(trendData);

          // 2. 湲됱긽???뚮옯??濡쒕뱶 (湲곗〈 ?좎?)
          const platformRes = await fetch(toApiUrl(`/trends/platform?platform=${selectedPlatform}`));
          const platformData = await platformRes.json();
          setRisingPlatforms(platformData);

          // ??3. ?좏뒠釉??멸린 ?숈쁺??濡쒕뱶 (移댄뀒怨좊━ ?뚮씪誘명꽣 異붽?!)
          // 湲곗〈: fetch('/api/videos')
          // ?섏젙: 荑쇰━?ㅽ듃留곸쑝濡?移댄뀒怨좊━ ?꾨떖
          const videoRes = await fetch(toApiUrl(`/videos?category=${encodeURIComponent(youtubeCategory)}`));
          const videoData = await videoRes.json();
          setYoutubeVideos(videoData);

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }, [selectedPlatform, youtubeCategory]);

  useEffect(() => {
    // 濡쒖뺄 ?ㅽ넗由ъ??먯꽌 ?좎? ?뺣낫 媛?몄삤湲?
    const savedUser = getStoredUser();
    if (savedUser?.nickname) {
      const { nickname } = savedUser;
      setUserName(nickname);
    }
  }, []);

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      try {
        const res = await fetch(toApiUrl(`/community/posts?platform=${selectedComm}`));
        const data = await res.json();
        setCommunityPosts(data);
      } catch (error) {
        console.error('而ㅻ??덊떚 ?멸린湲 濡쒕뱶 ?먮윭:', error);
      }
    };

    fetchCommunityPosts();
  }, [selectedComm]);

  return (
    <div 
      className="page"
      onClick={() => isDropdownOpen && setIsDropdownOpen(false)}
    >
      
      {/* ?곷떒 ?ㅻ뜑 */}
      <div className="flex justify-between items-start mb-6">
        <SearchBar 
          placeholder="관심있는 키워드나 주제를 검색해보세요..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          containerClassName="relative w-full max-w-3xl"
        />  

      </div>

      <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">안녕하세요, {userName}님 👋</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
        
        {/* 移대뱶 1: ?몃젋???ㅼ썙??*/}
        <div className="card-soft">
          <div className="mb-4">
            <h2 className="section-title-lg border-b-2 border-transparent hover:border-black transition-colors">
              트렌드 일일 급상승 키워드 Top 5
            </h2>
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

        {/* 移대뱶 2: ?뚮옯?쇰퀎 ?ㅼ썙??*/}
        <div className="card-soft relative">
          <div className="flex justify-between items-center mb-4">
            <h2 className="section-title-lg">
              플랫폼별 일일 급상승 키워드 Top 5
            </h2>
            <div
              className="tab-wrap"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`tab-btn flex items-center gap-1 ${
                    // [?섏젙] ?좏뒠釉??ㅻⅨ而ㅻ??덊떚 援щ텇 ?놁씠, ?쒕∼?ㅼ슫???대젮?덇굅??媛믪씠 ?좏깮?섏뼱 ?덉쑝硫??쒖꽦???됱긽(珥덈줉) ?곸슜
                    isDropdownOpen || selectedPlatform
                      ? 'tab-active text-green-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <span className="font-medium">
                    {/* [?섏젙] 蹂듭옟???쇳빆?곗궛???쒓굅 -> ?좏깮??媛믪쓽 Label??洹몃?濡??쒖떆 */}
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

      {/* ?좏뒠釉??뱀뀡 */}
      <div className="mb-8 relative group"> {/* group ?대옒??異붽?: ?몃쾭 ??踰꾪듉 ?쒖떆 ???쒖슜 媛??*/}
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">
            유튜브 일일 급상승 동영상
          </h2>
          
          {/* 移댄뀒怨좊━ ??(?곗륫 ?뺣젹???꾩슂?섎㈃ ?ш린??議곗젙, ?꾩옱???먮옒 ?꾩튂 ?좎? ?꾪빐 ?꾨옒 div ?ъ슜) */}
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
        
        {/* ?щ씪?대뜑 而⑦뀒?대꼫 */}
        <div className="relative">
          
          {/* ?쇱そ ?붿궡??踰꾪듉 */}
          <button 
            onClick={() => scroll('left')}
            className="hidden sm:flex absolute left-1 lg:left-0 top-1/2 -translate-y-1/2 lg:-ml-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous videos"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          {/* 鍮꾨뵒??由ъ뒪??(Grid -> Flex & Scroll) */}
          {/* slice(0, 5) -> slice(0, 10)?쇰줈 蹂寃?*/}
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

          {/* ?ㅻⅨ履??붿궡??踰꾪듉 */}
          <button 
            onClick={() => scroll('right')}
            className="hidden sm:flex absolute right-1 lg:right-0 top-1/2 -translate-y-1/2 lg:-mr-4 z-10 bg-white border border-gray-200 shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next videos"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

        </div>
      </div>

      {/* 3. UI ?뚮뜑留?(?좏뒠釉??뱀뀡 </div> 諛붾줈 ?꾨옒??異붽?) */}
      <div className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title-lg border-b-2 border-gray-800 w-fit pb-1">
            커뮤니티 인기글
          </h2>
        </div>

        {/* 而ㅻ??덊떚 移댄뀒怨좊━ ??*/}
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

        {/* 寃뚯떆湲 由ъ뒪??(洹몃━??2???덉씠?꾩썐) */}
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

      {/* 紐⑤떖 */}
      <SummaryModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        data={selectedKeyword} 
      />
    </div>
  );
};

export default HomePage;



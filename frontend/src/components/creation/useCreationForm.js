import { useEffect, useMemo, useState } from 'react';

const CONTENT_TYPES = ['카드뉴스', '포스터', '썸네일'];
const INDUSTRIES = ['크리에이터', '마케터'];

export const useCreationForm = ({ initialKeyword = '' }) => {
  const normalizedInitialKeyword = useMemo(() => initialKeyword.trim(), [initialKeyword]);
  const USER_TYPES = ['개인', '기업'];

  // UI 폼 상태 관리
  const [keyword, setKeyword] = useState(normalizedInitialKeyword);
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [userType, setUserType] = useState(USER_TYPES[0]);
  const [purpose, setPurpose] = useState('');
  const [target, setTarget] = useState('');
  const [essentialDetails, setEssentialDetails] = useState('');
  const [otherRequests, setOtherRequests] = useState('');

  // 쿼리 파라미터(URL)로 넘어온 초기 키워드 세팅
  useEffect(() => {
    setKeyword(normalizedInitialKeyword);
  }, [normalizedInitialKeyword]);

  // 백엔드(prompt.service.js)가 요구하는 포맷으로 페이로드 조립
  const buildSubmitPayload = () => {
  const mergedRequests = [essentialDetails, otherRequests]
    .filter((text) => text && text.trim() !== '')
    .join(' / ');

  return {
    keyword: keyword.trim(),
    type: selectedType,
    industry,
    userType,        
    context: purpose,
    target,
    otherRequests: mergedRequests,
  };
};

  return {
    // States
    keyword, selectedType, industry, userType, purpose, target, essentialDetails, otherRequests,
    contentTypes: CONTENT_TYPES,
    industries: INDUSTRIES,
    userTypes: USER_TYPES,
    
    // Setters
    setKeyword, setSelectedType, setIndustry, setUserType, setPurpose, setTarget, setEssentialDetails, setOtherRequests,
    
    // Methods
    buildSubmitPayload,
  };
};

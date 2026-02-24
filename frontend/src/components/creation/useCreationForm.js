import { useEffect, useMemo, useState } from 'react';
import {
  getTemplateMeta,
  interpolatePromptTemplate,
  recommendCreationPreset,
  recommendPromptTemplate,
} from '../../utils/promptTemplates';

const DEFAULT_KEYWORD = '저당 간식';

const CONTENT_TYPES = ['카드뉴스', '포스터', '썸네일'];

const INDUSTRIES = [
  '크리에이터/유튜브',
  '카페/디저트',
  '맛집/요식업',
  '뷰티/헤어샵',
  '패션/의류',
  '헬스/피트니스',
  '교육/클래스',
  '화장품/스킨케어',
  '리빙/인테리어',
  '여행/숙박',
  '온라인 쇼핑몰',
  '공구/마켓',
  '기타',
];

export const useCreationForm = ({ initialKeyword = '' }) => {
  const normalizedInitialKeyword = useMemo(() => initialKeyword.trim(), [initialKeyword]);
  const initialPreset = useMemo(
    () => recommendCreationPreset({ keyword: normalizedInitialKeyword || DEFAULT_KEYWORD }),
    [normalizedInitialKeyword],
  );

  const [keyword, setKeyword] = useState(normalizedInitialKeyword || DEFAULT_KEYWORD);
  const [selectedType, setSelectedType] = useState(initialPreset.type);
  const [industry, setIndustry] = useState(initialPreset.industry);
  const [purpose, setPurpose] = useState(initialPreset.purpose);
  const [target, setTarget] = useState(initialPreset.target);
  const [otherRequests, setOtherRequests] = useState('');
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState('trend_reaction');
  const [promptTemplateText, setPromptTemplateText] = useState('');
  const [isTemplateManuallyChanged, setIsTemplateManuallyChanged] = useState(false);
  const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false);
  const [isAutoProfileEnabled, setIsAutoProfileEnabled] = useState(true);

  const recommendedProfile = useMemo(() => recommendCreationPreset({ keyword }), [keyword]);

  const recommendedTemplate = useMemo(
    () =>
      recommendPromptTemplate({
        keyword,
        type: selectedType,
        industry,
        context: purpose,
        otherRequests,
      }),
    [keyword, selectedType, industry, purpose, otherRequests],
  );

  const recommendedTemplateMeta = useMemo(
    () => getTemplateMeta(recommendedTemplate.key),
    [recommendedTemplate],
  );

  const selectedTemplateMeta = useMemo(
    () => getTemplateMeta(selectedPromptTemplate),
    [selectedPromptTemplate],
  );

  const generatedTemplatePrompt = useMemo(
    () =>
      interpolatePromptTemplate(selectedTemplateMeta.prompt, {
        keyword,
        type: selectedType,
        industry,
        purpose,
        target,
        otherRequests,
      }),
    [selectedTemplateMeta, keyword, selectedType, industry, purpose, target, otherRequests],
  );

  useEffect(() => {
    if (!normalizedInitialKeyword) return;
    setKeyword(normalizedInitialKeyword);
    setIsAutoProfileEnabled(true);
  }, [normalizedInitialKeyword]);

  useEffect(() => {
    if (!isAutoProfileEnabled) return;
    setSelectedType(recommendedProfile.type);
    setIndustry(recommendedProfile.industry);
    setPurpose(recommendedProfile.purpose);
    setTarget(recommendedProfile.target);
  }, [recommendedProfile, isAutoProfileEnabled]);

  useEffect(() => {
    if (isTemplateManuallyChanged) return;
    setSelectedPromptTemplate(recommendedTemplate.key);
  }, [recommendedTemplate, isTemplateManuallyChanged]);

  useEffect(() => {
    setIsPromptManuallyEdited(false);
  }, [selectedPromptTemplate]);

  useEffect(() => {
    if (isPromptManuallyEdited) return;
    setPromptTemplateText(generatedTemplatePrompt);
  }, [generatedTemplatePrompt, isPromptManuallyEdited]);

  const applyRecommendedProfile = () => {
    setSelectedType(recommendedProfile.type);
    setIndustry(recommendedProfile.industry);
    setPurpose(recommendedProfile.purpose);
    setTarget(recommendedProfile.target);
  };

  const toggleAutoProfile = () => {
    if (isAutoProfileEnabled) {
      setIsAutoProfileEnabled(false);
      return;
    }

    setIsAutoProfileEnabled(true);
    applyRecommendedProfile();
  };

  const applyRecommendedTemplate = () => {
    setSelectedPromptTemplate(recommendedTemplate.key);
    setIsTemplateManuallyChanged(false);
  };

  const handlePromptTemplateChange = (nextTemplateKey) => {
    setSelectedPromptTemplate(nextTemplateKey);
    setIsTemplateManuallyChanged(true);
  };

  const restorePromptTemplateText = () => {
    setPromptTemplateText(generatedTemplatePrompt);
    setIsPromptManuallyEdited(false);
  };

  const handlePromptTemplateTextChange = (value) => {
    setPromptTemplateText(value);
    setIsPromptManuallyEdited(true);
  };

  const buildSubmitPayload = () => ({
    keyword: keyword.trim(),
    type: selectedType,
    industry,
    context: purpose,
    target,
    otherRequests,
    promptTemplate: selectedPromptTemplate || recommendedTemplate.key,
    promptTemplateText: (promptTemplateText || generatedTemplatePrompt).trim(),
  });

  return {
    keyword,
    selectedType,
    industry,
    purpose,
    target,
    otherRequests,
    selectedPromptTemplate,
    promptTemplateText,
    isAutoProfileEnabled,
    recommendedProfile,
    recommendedTemplate,
    recommendedTemplateMeta,
    selectedTemplateMeta,
    contentTypes: CONTENT_TYPES,
    industries: INDUSTRIES,
    setKeyword,
    setSelectedType,
    setIndustry,
    setPurpose,
    setTarget,
    setOtherRequests,
    toggleAutoProfile,
    applyRecommendedTemplate,
    handlePromptTemplateChange,
    restorePromptTemplateText,
    handlePromptTemplateTextChange,
    buildSubmitPayload,
  };
};


import { useEffect, useMemo, useState } from 'react';
import {
  getTemplateMeta,
  interpolatePromptTemplate,
  recommendPromptTemplate,
} from '../../utils/promptTemplates';

const CONTENT_TYPES = ['카드뉴스', '포스터', '썸네일'];

const INDUSTRIES = ['크리에이터', '마케터'];

export const useCreationForm = ({ initialKeyword = '' }) => {
  const normalizedInitialKeyword = useMemo(() => initialKeyword.trim(), [initialKeyword]);

  const [keyword, setKeyword] = useState(normalizedInitialKeyword);
  const [selectedType, setSelectedType] = useState(CONTENT_TYPES[0]);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [purpose, setPurpose] = useState('');
  const [target, setTarget] = useState('');
  const [essentialDetails, setEssentialDetails] = useState('');
  const [otherRequests, setOtherRequests] = useState('');
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState('trend_reaction');
  const [promptTemplateText, setPromptTemplateText] = useState('');
  const [isTemplateManuallyChanged, setIsTemplateManuallyChanged] = useState(false);
  const [isPromptManuallyEdited, setIsPromptManuallyEdited] = useState(false);

  const recommendedTemplate = useMemo(
    () =>
      recommendPromptTemplate({
        keyword,
        type: selectedType,
        industry,
        context: purpose,
        essentialDetails,
        otherRequests,
      }),
    [keyword, selectedType, industry, purpose, essentialDetails, otherRequests],
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
        essentialDetails,
        otherRequests,
      }),
    [selectedTemplateMeta, keyword, selectedType, industry, purpose, target, essentialDetails, otherRequests],
  );

  useEffect(() => {
    if (!normalizedInitialKeyword) return;
    setKeyword(normalizedInitialKeyword);
    setPurpose('');
    setTarget('');
    setEssentialDetails('');
  }, [normalizedInitialKeyword]);

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
    essentialDetails,
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
    essentialDetails,
    otherRequests,
    selectedPromptTemplate,
    promptTemplateText,
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
    setEssentialDetails,
    setOtherRequests,
    applyRecommendedTemplate,
    handlePromptTemplateChange,
    restorePromptTemplateText,
    handlePromptTemplateTextChange,
    buildSubmitPayload,
  };
};

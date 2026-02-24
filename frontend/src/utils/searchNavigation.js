export const navigateToAnalysisOnEnter = ({
  event,
  keyword,
  navigate,
  preserveRawKeyword = false,
}) => {
  if (event?.key !== 'Enter') return false;

  const rawKeyword = String(keyword ?? '');
  const trimmedKeyword = rawKeyword.trim();
  if (!trimmedKeyword) return false;

  const nextKeyword = preserveRawKeyword ? rawKeyword : trimmedKeyword;
  navigate(`/analysis?keyword=${nextKeyword}`);
  return true;
};

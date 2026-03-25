const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const toRecord = (value) => (isRecord(value) ? value : {});

const toStringValue = (value, fallback = '') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
};

const toNumberValue = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBooleanValue = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1' || value === 'true') return true;
  if (value === 0 || value === '0' || value === 'false') return false;
  return fallback;
};

export const toArray = (value) => (Array.isArray(value) ? value : []);

export const normalizeTrendList = (payload) =>
  toArray(payload).map((item, index) => {
    const row = toRecord(item);
    return {
      rank: toNumberValue(row.rank, index + 1),
      keyword: toStringValue(row.keyword),
      count: toNumberValue(row.count, 0),
      change: toStringValue(row.change, '0.0%'),
      isUp: typeof row.isUp === 'boolean' ? row.isUp : null,
      score: toNumberValue(row.score ?? row.trendScore ?? row.count, 0),
      trendScore: toNumberValue(row.trendScore ?? row.score, 0),
      isNegative: toBooleanValue(row.isNegative, false),
    };
  });

export const normalizePlatformTrendList = (payload) =>
  toArray(payload).map((item, index) => {
    const row = toRecord(item);
    return {
      rank: toNumberValue(row.rank, index + 1),
      keyword: toStringValue(row.keyword),
      count: toNumberValue(row.count, 0),
      score: toNumberValue(row.score, 0),
      isNegative: toBooleanValue(row.isNegative, false),
    };
  });

export const normalizeVideoList = (payload) =>
  toArray(payload).map((item) => {
    const row = toRecord(item);
    return {
      id: toStringValue(row.id),
      title: toStringValue(row.title),
      channel: toStringValue(row.channel),
      views: toStringValue(row.views),
      publish_time: toStringValue(row.publish_time),
      thumbnail: toStringValue(row.thumbnail),
    };
  });

export const normalizeNewsKeywordList = (payload) =>
  toArray(payload).map((item, index) => {
    const row = toRecord(item);
    return {
      rank: toNumberValue(row.rank, index + 1),
      keyword: toStringValue(row.keyword),
      count: toNumberValue(row.count, 0),
      score: toNumberValue(row.score, 0),
    };
  });

export const normalizeNewsList = (payload) =>
  toArray(payload).map((item) => {
    const row = toRecord(item);
    return {
      title: toStringValue(row.title),
      link: toStringValue(row.link),
      source: toStringValue(row.source),
    };
  });

export const normalizeCommunityPostList = (payload) =>
  toArray(payload).map((item, index) => {
    const row = toRecord(item);
    return {
      rank: toNumberValue(row.rank, index + 1),
      title: toStringValue(row.title),
      link: toStringValue(row.link),
      category: toStringValue(row.category),
    };
  });

export const normalizePreferencesResponse = (payload) => {
  const row = toRecord(payload);
  return {
    success: toBooleanValue(row.success, false),
    preferredCommunity: toStringValue(row.preferredCommunity),
    preferredNews: toStringValue(row.preferredNews),
  };
};

export const normalizeAnalysisResponse = (payload) => {
  const row = toRecord(payload);
  return {
    ...row,
    found: toBooleanValue(row.found, false),
    keyword: toStringValue(row.keyword),
    history: toArray(row.history),
    comments: toArray(row.comments),
    videos: toArray(row.videos),
    totalCommentCount: toNumberValue(row.totalCommentCount ?? row.total_comments, 0),
  };
};

export const normalizeCommentsResponse = (payload) => {
  const row = toRecord(payload);
  const comments = toArray(row.comments);
  return {
    comments,
    totalCount: toNumberValue(row.totalCount ?? row.total_comments, comments.length),
  };
};

export const normalizeSummaryResponse = (payload) => {
  const row = toRecord(payload);
  return {
    summary: toStringValue(row.summary),
  };
};

export const normalizeKeywordExistsResponse = (payload) => {
  const row = toRecord(payload);
  return {
    exists: toBooleanValue(row.exists, false),
    keyword: toStringValue(row.keyword),
    is_person: toNumberValue(row.is_person, 0),
  };
};


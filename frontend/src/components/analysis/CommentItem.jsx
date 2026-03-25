import React, { useEffect, useRef, useState } from 'react';
import { Export, LockKey } from '@phosphor-icons/react';
import { getSafeExternalUrl } from '../../utils/safeUrl';

const highlightText = (text, targetKeyword) => {
  if (!targetKeyword || !text) return text;
  const escaped = targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === targetKeyword.toLowerCase() ? (
      <span key={index} className="keyword-highlight font-bold px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    ),
  );
};

const formatComment = (text, keyword) => {
  if (!text) return null;
  const sentences = text.split(/(?<=[.?!])\s+|(?=@)/);

  return sentences.map((sentence, index) => {
    const trimmed = sentence.trim();
    if (!trimmed) return null;

    return (
      <p key={index} className="mb-2 last:mb-0">
        {highlightText(trimmed, keyword)}
      </p>
    );
  });
};

const CommentItem = ({
  comment,
  globalIndex,
  keyword,
  isIndividualFilter = false,
  isPersonKeyword = false,
  isRevealed = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  const isNegative = comment.sentiment === 'negative' || comment.sentiment === '\uBD80\uC815';
  const shouldHideAsPerson = isIndividualFilter && isNegative && isPersonKeyword;
  const shouldBlur = isIndividualFilter && isNegative && !isPersonKeyword && !isRevealed;

  const commentText = comment.text || comment.content;
  const safeCommentLink = getSafeExternalUrl(comment.link);

  useEffect(() => {
    if (!textRef.current || shouldBlur || shouldHideAsPerson) return;
    const { scrollHeight, clientHeight } = textRef.current;
    setIsOverflowing(scrollHeight > clientHeight);
  }, [commentText, shouldBlur, shouldHideAsPerson]);

  const formattedDate = comment.date ? new Date(comment.date).toISOString().split('T')[0] : '';

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1 border-b border-transparent pb-1">
        <span className="analysis-comment-title text-sm font-bold text-gray-700">
          반응 {globalIndex}{' '}
          <span className="analysis-comment-meta text-xs font-normal text-gray-400 ml-1">({comment.source})</span>
        </span>

        <div className="flex items-center gap-2">
          {formattedDate && <span className="analysis-comment-meta text-xs text-gray-400">{formattedDate}</span>}
        </div>
      </div>

      {shouldHideAsPerson ? (
        <div className="analysis-comment-locked relative p-4 bg-gray-50 rounded-lg text-center border border-dashed border-gray-200">
          <LockKey size={24} className="mx-auto mb-2 text-gray-400" weight="fill" />
          <p className="analysis-comment-locked-title text-sm font-bold text-gray-600">인물 관련 부정 댓글 비공개</p>
          <p className="analysis-comment-locked-desc text-xs text-gray-500 mt-1">사이트 정책상 인물에 대한 부정 댓글은 공개되지 않습니다.</p>
        </div>
      ) : (
        <div
          className={`analysis-comment-card relative p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all shadow-sm ${
            shouldBlur ? 'blur-[4px] opacity-40 select-none pointer-events-none' : ''
          }`}
        >
          <div ref={textRef} className={isExpanded ? '' : 'line-clamp-3'}>
            {formatComment(commentText, keyword)}
          </div>

          <div className="mt-2 flex justify-between items-end">
            <div>
              {isOverflowing && !shouldBlur && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="analysis-comment-more-btn text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors"
                >
                  {isExpanded ? '접기 ▲' : '더보기 ▼'}
                </button>
              )}
            </div>

            {safeCommentLink && !shouldBlur && (
              <a
                href={safeCommentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="analysis-comment-link flex items-center gap-1 text-xs text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                title="클릭하여 원문 보기"
              >
                <span>원문 보러가기</span>
                <Export size={12} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentItem;

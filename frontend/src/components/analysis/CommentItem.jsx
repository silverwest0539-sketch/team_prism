import React, { useEffect, useRef, useState } from 'react';
import { Export } from '@phosphor-icons/react';

const highlightText = (text, targetKeyword) => {
  if (!targetKeyword || !text) return text;
  const escaped = targetKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return parts.map((part, index) =>
    part.toLowerCase() === targetKeyword.toLowerCase() ? (
      <span key={index} className="bg-yellow-200 text-gray-900 font-bold px-0.5 rounded">
        {part}
      </span>
    ) : (
      part
    )
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

const CommentItem = ({ comment, globalIndex, keyword }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;
    const { scrollHeight, clientHeight } = textRef.current;
    setIsOverflowing(scrollHeight > clientHeight);
  }, [comment.text]);

  const formattedDate = comment.date ? new Date(comment.date).toISOString().split('T')[0] : '';

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-bold text-gray-700">
          반응 {globalIndex}{' '}
          <span className="text-xs font-normal text-gray-400 ml-1">({comment.source})</span>
        </span>
        {formattedDate && <span className="text-xs text-gray-400">{formattedDate}</span>}
      </div>

      <div className="relative p-3 bg-gray-50 rounded-lg text-sm text-gray-600 leading-relaxed border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all shadow-sm">
        <div ref={textRef} className={isExpanded ? '' : 'line-clamp-3'}>
          {formatComment(comment.text, keyword)}
        </div>

        <div className="mt-2 flex justify-between items-end">
          <div>
            {isOverflowing && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {isExpanded ? '접기 ▲' : '더보기 ▼'}
              </button>
            )}
          </div>

          {comment.link && (
            <a
              href={comment.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              title="클릭하여 원문 보기"
            >
              <span>원문 보러가기</span>
              <Export size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;

// src/components/home/InitialWizardModal.jsx
import React, { useState } from 'react';
import BasePreferenceModal from '../common/BasePreferenceModal';

const COMMUNITY_OPTIONS = [
  { label: '더쿠', value: 'theqoo' },
  { label: '디시인사이드', value: 'dcinside' },
  { label: '루리웹', value: 'ruliweb' },
  { label: '네이트판', value: 'natepan' },
  { label: 'FM코리아', value: 'fmkorea' },
];

const NEWS_OPTIONS = [
  { label: '대한민국', value: 'korea' },
  { label: '세계', value: 'world' },
  { label: '비즈니스', value: 'business' },
  { label: '과학/기술', value: 'tech' },
  { label: '엔터테인먼트', value: 'entertainment' },
  { label: '스포츠', value: 'sports' },
];

const InitialWizardModal = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedComm, setSelectedComm] = useState(null);

  if (!isOpen) return null;

  // 1단계: 커뮤니티 선택 완료 시
  const handleCommSubmit = (value) => {
    setSelectedComm(value);
    setStep(2); // 뉴스 선택으로 이동
  };

  // 2단계: 뉴스 선택 완료 시
  const handleNewsSubmit = (newsValue) => {
    // 커뮤니티와 뉴스 선택값을 객체로 묶어서 부모(HomePage)로 전달
    onComplete({ community: selectedComm, news: newsValue });
  };

  return (
    <>
      {step === 1 && (
        <BasePreferenceModal
          isOpen={true}
          title="관심 커뮤니티를 선택해주세요"
          subtitle="선택하신 커뮤니티의 인기글을 먼저 보여드릴게요!"
          options={COMMUNITY_OPTIONS}
          hasSkip={true}
          submitText="다음 단계로 (1/2)"
          onSubmit={handleCommSubmit}
        />
      )}
      
      {step === 2 && (
        <BasePreferenceModal
          isOpen={true}
          title="관심 뉴스를 선택해주세요"
          subtitle="선택하신 분야의 뉴스를 먼저 보여드릴게요!"
          options={NEWS_OPTIONS}
          hasSkip={true}
          submitText="PicKey 시작하기"
          onSubmit={handleNewsSubmit}
        />
      )}
    </>
  );
};

export default InitialWizardModal;
// src/components/home/InitialWizardModal.jsx
import React, { useState } from 'react';
import BasePreferenceModal from '../common/BasePreferenceModal';

const PLATFORM_OPTIONS = [
  { label: '유튜브', value: 'youtube' },
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

  const handleCommSubmit = (value) => {
    setSelectedComm(value);
    setStep(2); 
  };

  const handleNewsSubmit = (newsValue) => {
    onComplete({ community: selectedComm, news: newsValue });
  };

  return (
    <>
      {step === 1 && (
        <BasePreferenceModal
          isOpen={true}
          title="관심 플랫폼을 선택해주세요"
          subtitle="선택하신 플랫폼의 인기글을 먼저 보여드릴게요!"
          options={PLATFORM_OPTIONS}
          submitText="다음 단계로 (1/2)"
          onSubmit={handleCommSubmit}
          onReset={() => handleCommSubmit('skip')} // 초기화 클릭 시 스킵
        />
      )}
      
      {step === 2 && (
        <BasePreferenceModal
          isOpen={true}
          title="관심 뉴스를 선택해주세요"
          subtitle="선택하신 분야의 뉴스를 먼저 보여드릴게요!"
          options={NEWS_OPTIONS}
          submitText="PicKey 시작하기"
          onSubmit={handleNewsSubmit}
          onReset={() => handleNewsSubmit('skip')} // 초기화 클릭 시 스킵
        />
      )}
    </>
  );
};

export default InitialWizardModal;
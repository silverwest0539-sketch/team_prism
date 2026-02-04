# Frontend 리팩토링 완료 가이드



## 새로운 폴더 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/              ⭐ 여러 페이지에서 공통으로 사용
│   │   │   ├── SearchBar.jsx
│   │   │   └── HeaderActions.jsx
│   │   │
│   │   ├── home/                ⭐ HomePage 전용 컴포넌트
│   │   │   └── SummaryModal.jsx
│   │   │
│   │   ├── creation/            ⭐ CreationPage 전용 컴포넌트
│   │   │   ├── InputPanel.jsx
│   │   │   └── ResultPanel.jsx
│   │   │
│   │   └── layout/              ⭐ 레이아웃 컴포넌트
│   │       ├── Layout.jsx
│   │       └── Sidebar.jsx
│   │
│   ├── utils/                   ⭐ 유틸리티 함수
│   │   └── formatters.js        (formatViews, formatDate 등)
│   │
│   ├── styles/                  ⭐ CSS 파일
│   │   ├── index.css            (Tailwind import만)
│   │   ├── components.css       (컴포넌트 스타일)
│   │   └── utilities.css        (레이아웃, 효과)
│   │
│   └── pages/                   ⭐ 페이지 컴포넌트
│       ├── HomePage.jsx
│       ├── AnalysisPage.jsx
│       ├── CreationPage.jsx
│       ├── MyPage.jsx
│       ├── LoginPage.jsx
│       ├── SignupPage.jsx
│       └── LandingPage.jsx
│
└── .vscode/
    └── settings.json            ⭐ VSCode 설정 (CSS 경고 제거)
```

---



## 주요 변경사항

### 1. 공통 컴포넌트 생성

#### `components/common/SearchBar.jsx` ✨ NEW
**사용처:** HomePage, AnalysisPage

```jsx
import SearchBar from '../components/common/SearchBar';

<SearchBar 
  placeholder="검색어를 입력하세요"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  onKeyDown={handleSearch}
/>
```

#### `components/common/HeaderActions.jsx` ✨ NEW
**사용처:** HomePage (확장 가능)

```jsx
import HeaderActions from '../components/common/HeaderActions';

<HeaderActions 
  showNotificationText 
  notificationText="Cont..." 
/>
```

---

### 2. 유틸리티 함수 통합

#### `utils/formatters.js` ✨ NEW
**기존:** HomePage, AnalysisPage에 각각 중복 정의  
**변경:** 하나의 파일로 통합

```javascript
import { formatViews, formatDate } from '../utils/formatters';

// 사용 예시
formatViews(125000);     // "12.5만회"
formatDate("2024-01-15"); // "21일 전"
```

**포함된 함수:**
- `formatViews()` - 조회수 포맷 (만회, 천회)
- `formatDate()` - "N일 전" 포맷
- `formatDateLabel()` - YYYYMMDD → MM.DD
- `formatDateForInput()` - YYYYMMDD → YYYY-MM-DD

---

### 3. CSS 클래스 시스템

#### `styles/components.css` ✨ NEW
재사용 가능한 컴포넌트 스타일

**자주 쓰는 클래스:**
```css
.page              /* 페이지 전체 래퍼 */
.card              /* 기본 카드 */
.card-soft         /* 부드러운 카드 */
.section-title-lg  /* 큰 섹션 제목 */
.btn               /* 기본 버튼 */
.btn-primary       /* 파란색 버튼 */
.form-input        /* 입력 필드 */
.chip              /* 카테고리 칩 */
```

**사용 예시:**
```jsx
// 기존 (반복)
<div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">

// 변경 (재사용)
<div className="card-soft">
```

#### `styles/utilities.css` ✨ NEW
레이아웃 및 특수 효과

```css
.creation-grid     /* CreationPage 그리드 */
.blur-disabled     /* AnalysisPage 비활성화 */
.scrollbar-hide    /* 스크롤바 숨김 */
.line-clamp-2      /* 텍스트 2줄 제한 */
```

---

### 4. 페이지별 컴포넌트 분리

#### HomePage 전용
```
components/home/
└── SummaryModal.jsx  (키워드 클릭 시 나오는 모달)
```

#### CreationPage 전용
```
components/creation/
├── InputPanel.jsx
└── ResultPanel.jsx
```

**규칙:**
- **2개 이상 페이지에서 사용** → `common/`
- **1개 페이지에서만 사용** → `페이지명/`

---



## CSS 클래스 가이드

### 컴포넌트 스타일 (components.css)

| 클래스 | 설명 | 사용 위치 |
|--------|------|-----------|
| `.page` | 페이지 래퍼 (bg-gray-50, padding) | HomePage, AnalysisPage, MyPage |
| `.card` | 기본 카드 (border-gray-200) | AnalysisPage |
| `.card-soft` | 부드러운 카드 (border-gray-100) | HomePage, MyPage, Login, Signup |
| `.section-title-lg` | 큰 섹션 제목 | HomePage, MyPage |
| `.btn-primary` | 파란색 버튼 | 모든 페이지 |
| `.form-input` | 입력 필드 | LoginPage, SignupPage |
| `.chip` | 카테고리 칩 | HomePage |
| `.tab-wrap` | 탭 컨테이너 | HomePage |

### 유틸리티 (utilities.css)

| 클래스 | 설명 | 사용 위치 |
|--------|------|-----------|
| `.creation-grid` | 2열 그리드 레이아웃 | CreationPage |
| `.blur-disabled` | 비활성화 상태 (블러) | AnalysisPage |
| `.overlay-center` | 중앙 오버레이 | AnalysisPage |
| `.scrollbar-hide` | 스크롤바 숨김 | HomePage |
| `.line-clamp-2` | 텍스트 2줄 제한 | VideoCard |



## 새 페이지 추가할 때

### 1. 페이지 파일 생성
```jsx
// src/pages/NewPage.jsx
import React from 'react';

const NewPage = () => {
  return (
    <div className="page">
      <h1 className="section-title-lg">새 페이지</h1>
      
      <div className="card-soft">
        {/* 내용 */}
      </div>
    </div>
  );
};

export default NewPage;
```

### 2. 페이지 전용 컴포넌트가 필요하면
```
components/
└── newpage/           ← 폴더 생성
    └── NewComponent.jsx
```

### 3. CSS 클래스 재사용
- `components.css` 확인 → 기존 클래스 활용
- 새 클래스 필요 시 → `components.css`에 추가

---



## 컨벤션

### Import 순서
```jsx
// 1. React 관련
import React, { useState, useEffect } from 'react';

// 2. 라우터
import { useNavigate, Link } from 'react-router-dom';

// 3. 외부 라이브러리
import { PlayCircle } from 'lucide-react';

// 4. 공통 컴포넌트
import SearchBar from '../components/common/SearchBar';

// 5. 페이지 전용 컴포넌트
import SummaryModal from '../components/home/SummaryModal';

// 6. 유틸리티
import { formatViews, formatDate } from '../utils/formatters';
```

### 컴포넌트 분리 기준(components 폴더)
-  **2개 이상 페이지**에서 사용 → `common/`
-  **1개 페이지**에서만 사용 → `페이지명/`
-  **100줄 이상**으로 복잡 → 컴포넌트 분리o
-  **50줄 미만**으로 단순 → 인라인(컴포넌트 분리x)
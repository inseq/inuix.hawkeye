# 🦅👁️ 호크아이 - UI 화면 대조 검토기

## 1. 개요

이 플러그인은 웹 페이지 상에서 이미지 오버레이 기능을 제공하여
웹 브라우저상의 UI와 원본 디자인 이미지를 시각적으로 비교할 수 있도록 도와줍니다.
퍼블리싱 개발과 검토 단계에서 활용하여 웹 UI 개발 산출물의 품질을 높여보세요!

- **디자인 비교**: 원본 디자인 파일과 웹 화면을 겹쳐보며 쉽게 비교할 수 있도록 도와줍니다.
- **정확한 배치**: 오버레이 이미지 위치 미세 조정으로 퍼블리싱 화면과 일치 여부를 확인합니다.
- **URL별 이미지 상태 저장**: 화면을 새로고침해도 마지막 상태가 유지됩니다. UI 개발 단계에서부터 활용해 보세요!

## 2. 라이브러리 추가하기

### 2.1 기본 사용법

HTML의 `<head>` 또는 `<body>` 태그 안에 라이브러리 2줄만 추가하세요.
별도의 설정 없이도 **플러그인이 바로 작동**합니다!

```html
<script src="https://cdn.jsdelivr.net/npm/moveable/dist/moveable.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@latest/dist/inuix.hawkeye.min.js"></script>
```

### 2.2 옵션 설정

호크아이는 전역, 도메인, IP 대역, PMS 환경별로 노출 여부를 설정할 수 있습니다.
```javascript
// 기본 설정 예시
HawkeyeOverlayTool.initialize({
 // 전역 활성화 여부
 enabled: true,

 // 도메인별 활성화 설정
 domains: {
   'pms.inseq.co.kr': true,
   'dev.inseq.co.kr': true,
   'localhost': true
 },

 // IP 대역별 활성화 설정
 ipRanges: [
   '192.168.',  // 192.168.x.x 대역 활성화
   '10.',       // 10.x.x.x 대역 활성화
 ],

 // PMS 환경 설정
 pms: {
   enabled: true,
   domain: 'pms.inseq.co.kr',
   branches: {
     'master': false,     // master 브랜치 비활성화
     'develop': true,     // develop 브랜치 활성화
     'feature/*': true,   // feature/ 로 시작하는 브랜치 활성화
     'hotfix/*': true     // hotfix/ 로 시작하는 브랜치 활성화
   }
 }
});
```

### 비활성화 예제
```html
<!-- 1. 라이브러리 -->
<script src="https://cdn.jsdelivr.net/npm/moveable/dist/moveable.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@latest/dist/inuix.hawkeye.min.js"></script>

<!-- 2. 초기화 -->
<script>
HawkeyeOverlayTool.initialize({
  enabled: false
});
</script>

```

### 브랜치 노출 설정 변경 예제
```html
<!-- 1. 라이브러리 -->
<script src="https://cdn.jsdelivr.net/npm/moveable/dist/moveable.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@latest/dist/inuix.hawkeye.min.js"></script>

<!-- 2. 초기화 -->
<script>
  HawkeyeOverlayTool.initialize({
    pms: {
      branches: {
        'master': true,
        'develop': true
      }
    }
  });
</script>
```

### 설정 항목 설명

- **enabled**: 호크아이 도구의 전역 활성화 여부를 설정합니다. `false`로 설정하면 도구 자체가 로드되지 않습니다.

- **domains**: 도메인별 활성화 여부를 설정합니다.
  - 키: 도메인 이름
  - 값: true(활성화) 또는 false(비활성화)
  - 설정되지 않은 도메인은 기본적으로 활성화됩니다.

- **pms**: PMS 환경 관련 설정
  - `enabled`: PMS 기능 활성화 여부
  - `domain`: PMS 도메인 주소
  - `branches`: 브랜치별 활성화 설정
    - 와일드카드 패턴 지원 (예: 'feature/*')
    - 설정되지 않은 브랜치는 기본적으로 활성화됩니다.

### 2.3 플러그인

호크아이는 플러그인을 통해 기능을 확장할 수 있습니다.

#### 나타샤 플러그인

나타샤는 HTML 페이지를 캡처하여 오버레이하는 플러그인입니다.

```html
<!-- 나타샤 플러그인 추가 -->
<script src="https://cdn.jsdelivr.net/gh/inseq/hawkeye-natasha@latest/dist/hawkeye-natasha.min.js"></script>

<script>
// 나타샤 플러그인 사용
HawkeyeOverlayTool.use(new NatashaPlugin({
  timeout: 5000  // 요청 타임아웃 (ms)
}));

// 호크아이 초기화
HawkeyeOverlayTool.initialize({
  enabled: true,
  plugins: {
    natasha: {
      enabled: true
    }
  }
});
</script>
```

## 3. 호크아이 사용하기

화면 우측상단에 호크아이 툴바가 표시됩니다.
- [🔗 호크아이 데모 미리보기](http://pms.inseq.co.kr/inuix/hawkeye/files/master/index.html)
- [🔗 홈페이지 적용 예제 미리보기](http://pms.inseq.co.kr/inuix/hawkeye/files/master/demos/example1.html)

### 3.1 이미지 업로드

1. 클립보드의 이미지를 붙여넣거나, 파일 업로드로 디자인 이미지를 업로드 합니다.
2. 선택한 이미지가 퍼블리싱 화면 위에 반투명하게 표시됩니다.

### 3.2 이미지 옵션 조정

1. 투명도 슬라이더로 오버레이 이미지의 투명도를 변경합니다.
2. 이미지 크기 조절
   - 업로드시 뷰포트 크기 기반 자동 스케일 계산
   - 수동 크기 조절 (마우스 드래그)
   - 비율 고정 크기 조절
3. 위치 제어
   - 이미지 드래그 앤 드롭
   - 방향키를 통한 미세 조정 (1px 단위)
   - 좌표 직접 입력
   - 프리셋 위치 이동 (좌상단, 우상단, 좌하단, 우하단, 중앙)

### 3.3 초기화
1. 새로고침해도 URL 기반으로 이미지의 마지막 상태를 유지합니다. 
검토단계 뿐 아니라 개발중에도 활용할 수 있습니다.
2. **초기화** 버튼을 클릭하거나, 새로운 이미지를 업로드하면 이전 이미지 상태가 초기화 됩니다.


## 릴리즈 노트

### v1.1.1 2025.02.10
- 동일 도메인 내 URL 캡쳐 기능 추가 (나타샤)
- 가시성 토글 상태 유지 버그 개선
- 이미지 잠금 상태 기능 개선

### v1.1.0 2024.12.30
- 단축키 기능 추가 및 개선
- 툴바 최소화 기능 개선
- 이미지 가로 스크롤 버그 수정

### v1.0.3 2024.11.02
- 북마클릿 사용법 추가
- 프로덕션 빌드 시 콘솔 로그 제거
- 중앙 정렬 기능 변경 : X축 중앙정렬만 되도록
- 간헐적으로 반전 버튼 이미지 색상 회색으로 보이는 문제 해결

### v1.0.2 2024.10.31
- CDN 이슈 해결
- 옵션 설정 버그 수정
- 버전 정보 추가 등 일부 UI 개선
- Shift + 방향키: 10px 단위 이동 기능 추가

### v1.0.1 2024.10.29
- 프로젝트 구조 개선 등 리팩토링

### v1.0.0 2024.10.25
- 호크아이 코어 배포


## 기타

### 라이선스

- [(주)인시퀀스 I.N.UIX Framework](https://inseq.co.kr/ko/cntnts/i-26/web.do)
- leroro@inseq.co.kr
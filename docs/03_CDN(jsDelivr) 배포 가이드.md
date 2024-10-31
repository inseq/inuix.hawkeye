# CDN(jsDelivr) 배포 가이드

## 1. CDN 배포

### 1.1. CDN 배포 명령어
```git push -v --tags github master:master```
```git push -v -f --tags github master:master```

### 1.2. CDN 퍼지(캐시 초기화) 요청 방법
퍼지 요청은 jsDelivr의 캐시를 강제로 초기화하는 API 호출
한번 퍼지하면 전체 사용자에게 적용됨
```
특정버전
https://purge.jsdelivr.net/gh/inseq/inuix.hawkeye@1.0.1/dist/inuix.hawkeye.min.js

최신태그
https://purge.jsdelivr.net/gh/inseq/inuix.hawkeye@latest/dist/inuix.hawkeye.min.js

최신코드
https://purge.jsdelivr.net/gh/inseq/inuix.hawkeye@master/dist/inuix.hawkeye.min.js
```

## 2. CDN 관리 가이드

### 2.1. URL 구조 차이점
- `@master`: 브랜치의 실시간 최신 코드
- `@latest`: 최신 태그 버전
- `@{tag}`: 특정 태그 버전 (예: @1.0.1)
- @ 없음: 캐시된 버전 (권장하지 않음)

### 2.2. 캐시 퍼지 방법
- **퍼지란?** CDN의 캐시를 강제로 초기화하는 작업
- CDN은 서버 부하를 줄이기 위해 파일을 캐시하는데, 코드가 업데이트되어도 이 캐시 때문에 변경사항이 즉시 반영되지 않음
- 퍼지 요청을 통해 CDN의 캐시를 지우고 GitHub의 최신 파일을 가져오도록 강제하는 것이 가능

```
https://purge.jsdelivr.net/gh/{username}/{repo}@{branch or tag}/path/to/file
```
- 전체 CDN 네트워크에 적용
- 모든 사용자의 캐시 초기화됨
- CloudFlare, Fastly 프로바이더 동시 적용


### 2.3. 안정적인 배포 절차
```bash
# 1. 태그 관리
git tag 1.0.1
git push github 1.0.1

# 2. 태그 삭제 필요시
git tag -d 1.0.1
git push github --delete refs/tags/1.0.1
```

### 2.4. 권장 사용법
```html
<!-- 개발용 (실시간 반영) -->
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@master/dist/inuix.hawkeye.min.js"></script>

<!-- 프로덕션용 (안정화 버전) -->
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@latest/dist/inuix.hawkeye.min.js"></script>
```
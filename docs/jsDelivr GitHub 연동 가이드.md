# HawkEye CDN(jsDelivr) 연동 가이드

## 1. **URL 구조 차이점**
- `@master`: 브랜치의 실시간 최신 코드
- `@latest`: 최신 태그 버전
- `@{tag}`: 특정 태그 버전 (예: @1.0.1)
- @ 없음: 캐시된 버전 (권장하지 않음)

## 2. **캐시 퍼지 방법**
```
https://purge.jsdelivr.net/gh/{username}/{repo}@{branch or tag}/path/to/file
```
- 전체 CDN 네트워크에 적용
- 모든 사용자의 캐시 초기화됨
- CloudFlare, Fastly 프로바이더 동시 적용
### 퍼지란? 
- CDN의 캐시를 강제로 초기화하는 작업
- CDN은 서버 부하를 줄이기 위해 파일을 캐시하는데, 코드가 업데이트되어도 이 캐시 때문에 변경사항이 즉시 반영되지 않음
- 퍼지 요청을 통해 CDN의 캐시를 지우고 GitHub의 최신 파일을 가져오도록 강제하는 것이 가능

## 3. **안정적인 배포 절차**
```bash
# 1. 태그 관리
git tag 1.0.1
git push github 1.0.1

# 2. 태그 삭제 필요시
git tag -d 1.0.1
git push github --delete refs/tags/1.0.1
```

## 4. **권장 스크립트 태그**
```html
<!-- 개발용 (실시간 반영) -->
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@master/dist/inuix.hawkeye.min.js"></script>

<!-- 프로덕션용 (안정화 버전) -->
<script src="https://cdn.jsdelivr.net/gh/inseq/inuix.hawkeye@latest/dist/inuix.hawkeye.min.js"></script>
```
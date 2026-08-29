# 현주님 HUB V3 — YouTube API 연동용

## 1. 준비
- Google Cloud에서 YouTube Data API v3를 활성화하고 API Key를 만듭니다.
- `.env.example`을 `.env.local`로 복사합니다.
- `YOUTUBE_API_KEY`에 키를 넣습니다.
- 채널 ID는 이미 `UCltJz_jkCxQxd2mTqrn3Lfg`로 넣어두었습니다.

## 2. 실행
```bash
npm install
npm run dev
```
브라우저에서 `http://localhost:3000`을 엽니다.

## 3. 현재 자동 연동
- 최신 영상: 채널의 uploads playlist → 자동 조회
- 영상 조회수: videos.list로 조회
- 공개 라이브: search.list(eventType=live)로 조회
- YouTube 커뮤니티: 현재는 실제 Community 페이지로 연결

## 4. 다음 단계
- 실제 배포(Vercel 등)
- 브라우저 Push 알림 + Service Worker
- 라이브 감지 주기/캐시 최적화
- 채널 소유자 OAuth 연동이 필요한 기능 검토

API 키는 `.env.local`에만 넣고 GitHub 등에 공개하지 마세요.

# 상품 관리

Supabase의 상품 데이터를 조회 · 검색 · 추가 · 삭제하는 React 페이지다. 배포본은 로그인 없이 누구나 추가 · 삭제할 수 있다.

## 로컬 실행

1. Supabase에서 `docs/dummy/supabase/01_schema.sql`, `02_seed.sql`을 먼저 실행한다.
2. `.env.example`을 `.env.local`로 복사하고 Project URL과 secret key를 넣는다.
3. 서버를 실행하고 http://127.0.0.1:5199 를 연다. `index.html`을 파일로 직접 열면 화면이 나오지 않는다.

```bash
npm run dev
```

## Vercel 배포

1. Vercel에서 GitHub 저장소를 가져오고 Root Directory를 `product-admin`으로 지정한다.
2. 환경 변수 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 넣고 배포한다. 이름에 `VITE_`를 붙이면 빌드가 멈춘다.

## 구조

- `src/`: React 화면
- `server/api.js`: 입력 검증과 `/api` 경로
- `server/supabaseStore.js`: Supabase 읽기 · 쓰기
- `api/index.js`: 배포본의 API(Vercel 함수)
- `vite.config.js`: 로컬 개발 서버 안에 API를 붙인다

## 주의

- 배포본에 로그인이 없으므로 주소를 아는 사람은 누구나 데이터를 추가 · 삭제할 수 있고, 누가 했는지 남지 않는다. 실제 데이터를 넣지 않는다.
- 요청 횟수 제한이 없어, 대량 호출 시 Vercel · Supabase 사용량이 늘 수 있다.
- 지워진 초기 상품은 `02_seed.sql`을 다시 실행하면 복구된다. 이후 추가된 상품은 복구되지 않는다.
- secret key는 모든 데이터를 고칠 수 있다. `.env.local`과 Vercel 환경 변수에만 둔다.
- 삭제는 영구 삭제이며 하위 데이터도 함께 지워진다.
- 추가 도중 실패하면 넣었던 상품을 지워 되돌린다. 트랜잭션이 아니므로 되돌리기까지 실패하면 오류 메시지의 상품을 직접 확인한다.

## 테스트

```bash
npm test
```

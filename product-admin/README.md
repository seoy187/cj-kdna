# 상품 관리 (로컬 전용)

Supabase의 상품 데이터를 조회 · 검색 · 추가 · 삭제하는 React 페이지다.

## 실행

1. Supabase에서 `docs/dummy/supabase/01_schema.sql`, `02_seed.sql`을 먼저 실행한다.
2. `.env.example`을 `.env.local`로 복사하고 Project URL과 secret key를 넣는다.
3. 서버를 실행하고 http://127.0.0.1:5199 를 연다. `index.html`을 파일로 직접 열면 화면이 나오지 않는다.

```bash
npm run dev
```

## 구조

- `src/`: React 화면
- `server/api.js`: 입력 검증과 `/api` 경로
- `server/supabaseStore.js`: Supabase 읽기 · 쓰기
- `vite.config.js`: 개발 서버 안에 API를 붙이고, secret key는 여기서만 읽는다

## 주의

- secret key는 RLS를 우회해 모든 데이터를 고칠 수 있다. `.env.local`은 git에 올리지 않고, 이름에 `VITE_`를 붙이지 않는다.
- 이 앱은 로컬 전용이다. 인증이 없으므로 서버에 배포하거나 `--host`로 외부에 열지 않는다.
- 삭제는 영구 삭제이며 하위 데이터도 함께 지워진다. 판매만 멈출 상품은 Supabase에서 `status`를 바꾼다.
- 추가 도중 실패하면 넣었던 상품을 지워 되돌린다. 트랜잭션이 아니므로 되돌리기까지 실패하면 오류 메시지의 상품을 직접 확인한다.

## 테스트

```bash
npm test
```

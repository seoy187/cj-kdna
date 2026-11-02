import { createClient } from '@supabase/supabase-js';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { createApi } from './server/api.js';
import { createSupabaseStore } from './server/supabaseStore.js';

// 개발 서버 안에서 /api를 처리한다. secret key는 이 서버 코드에서만 쓴다
function localApi(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      const store = env.SUPABASE_URL && env.SUPABASE_SECRET_KEY
        ? createSupabaseStore(createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          }))
        : null;
      server.middlewares.use('/api', createApi(store));
    },
  };
}

// VITE_ 값은 공개되는 파일에 그대로 들어가므로, Supabase 값을 VITE_로 넣으면 빌드를 멈춘다
function assertNoExposedSecret(env) {
  const exposed = Object.keys(env).filter((name) => name.startsWith('VITE_') && name.includes('SUPABASE'));
  if (exposed.length) {
    throw new Error(`${exposed.join(', ')}: VITE_를 빼고 SUPABASE_URL, SUPABASE_SECRET_KEY로 설정하세요.`);
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (command === 'build') assertNoExposedSecret(env);
  return {
    plugins: [react(), localApi(env)],
    // 이 컴퓨터에서만 접속할 수 있게 루프백 주소에만 연다
    server: { host: '127.0.0.1', port: 5199, strictPort: true },
  };
});

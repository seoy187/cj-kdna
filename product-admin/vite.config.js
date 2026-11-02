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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), localApi(env)],
    // 이 컴퓨터에서만 접속할 수 있게 루프백 주소에만 연다
    server: { host: '127.0.0.1', port: 5199, strictPort: true },
  };
});

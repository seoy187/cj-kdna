import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { createApi } from '../server/api.js';
import { createSupabaseStore } from '../server/supabaseStore.js';

// Vercel 함수. vercel.json이 /api/* 요청을 모두 이 파일로 보낸다
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
const store = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createSupabaseStore(createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }))
  : null;

const app = express();
app.use('/api', createApi(store, { deployed: true }));

export default app;

# REBECA RACING — Guia de Integração Supabase & Deploy na Vercel

## 1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. No menu lateral, abra **SQL Editor**.
3. Copie todo o conteúdo de `supabase/schema.sql` e execute no SQL Editor. Isso cria todas as 8 tabelas (`profiles`, `workout_plans`, `workout_days`, `exercises`, `exercise_completions`, `progress_history`, `daily_checkins`, `daily_messages`), índices e políticas de segurança **Row Level Security (RLS)** isolando cada conta por `auth.uid()`.

## 2. Configurar Autenticação (Supabase Auth)
1. Em **Authentication → Providers → Email**, confirme que o provedor por e-mail/senha está habilitado.
2. Em **Authentication → URL Configuration**, adicione a URL da Vercel em **Site URL** e **Redirect URLs** (necessário para recuperação de senha).

## 3. Variáveis de Ambiente
Crie um `.env` local (ou configure na Vercel em **Project Settings → Environment Variables**):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

> Nunca exponha `service_role` no frontend. Apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` devem ser usadas no cliente.

## 4. Deploy na Vercel
1. Conecte o repositório na Vercel.
2. Framework Preset: **Vite**.
3. Build Command: `npm run build` · Output Directory: `dist`.
4. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas variáveis de ambiente e faça o deploy.

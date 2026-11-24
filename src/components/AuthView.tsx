import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from '../services/database';
import { AuthUser } from '../types/racing';

interface AuthViewProps {
  onAuthenticated: (user: AuthUser) => void;
  onBackToGrid: () => void;
}

type AuthMode = 'login' | 'signup' | 'reset';

export function AuthView({ onAuthenticated, onBackToGrid }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('Rebeca');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(email, password);
        if (res.error || !res.user) {
          setErrorMsg(res.error ?? 'Não foi possível entrar.');
        } else {
          onAuthenticated(res.user);
        }
      } else if (mode === 'signup') {
        const res = await signUpWithEmail(email, password, name);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          onAuthenticated(res.user);
        } else if (res.info) {
          setInfoMsg(res.info);
        }
      } else {
        const res = await requestPasswordReset(email);
        if (res.ok) setInfoMsg(res.message);
        else setErrorMsg(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#080B0E] telemetry-grid-bg text-white flex flex-col justify-between px-6 py-8">
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onBackToGrid}
          className="inline-flex items-center gap-2 text-sm text-[#C5CBD0] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00D2BE]" />
          <span>Voltar ao Grid de Largada</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-auto py-8">
        <div className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6 sm:p-8 space-y-6">
          <div>
            <p className="font-mono-telemetry text-xs tracking-[0.2em] text-[#00D2BE] uppercase">
              Acesso da Piloto · REBECA RACING
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold text-white">
              {mode === 'login'
                ? 'Entrar na Garagem'
                : mode === 'signup'
                  ? 'Criar Conta Exclusiva'
                  : 'Recuperar Senha'}
            </h1>
            <p className="mt-1 text-sm text-[#C5CBD0]">
              {mode === 'login'
                ? 'Seus treinos, recados do Nauhan e evolução ficam protegidos na sua conta.'
                : mode === 'signup'
                  ? 'Cadastre seu acesso para salvar seus treinos, medidas e mensagens.'
                  : 'Informe seu e-mail cadastrado para redefinir sua senha.'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded bg-[#080B0E] border border-[#707982]/25">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                  : 'text-[#C5CBD0] hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2 rounded text-xs font-medium transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                  : 'text-[#C5CBD0] hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded bg-red-950/50 border border-red-500/50 text-xs sm:text-sm text-red-200">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded bg-[#080B0E] border border-[#00D2BE]/60 text-xs sm:text-sm text-[#00D2BE]">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs text-[#C5CBD0] mb-1.5">
                  Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#707982] absolute left-3.5 top-3" />
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs text-[#C5CBD0] mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#707982] absolute left-3.5 top-3" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rebeca@email.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="auth-pass" className="block text-xs text-[#C5CBD0] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#707982] absolute left-3.5 top-3" />
                  <input
                    id="auth-pass"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-sm focus:border-[#00D2BE] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-2.5 text-[#707982] hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-sm tracking-[0.1em] uppercase hover:bg-[#1de6d2] transition-colors disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? 'Processando...'
                : mode === 'login'
                  ? 'Entrar no Cockpit'
                  : mode === 'signup'
                    ? 'Criar Conta e Começar'
                    : 'Enviar Recuperação'}
            </button>
          </form>

          <div className="pt-2 border-t border-[#707982]/20 flex items-center justify-between text-xs">
            {mode !== 'reset' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer"
              >
                Esqueci minha senha
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer"
              >
                Voltar ao login
              </button>
            )}

            <span className="text-[#707982]">
              {isSupabaseConfigured ? 'Supabase Auth conectado' : 'Modo Preview Seguro'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto text-center text-xs text-[#707982]">
        REBECA RACING · THE PERFECT SHAPE. THE PERFECT RACE.
      </div>
    </section>
  );
}

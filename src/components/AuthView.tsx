import { useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from '../services/database';
import { AuthUser } from '../types/racing';

interface AuthViewProps {
  onAuthenticated: (user: AuthUser) => Promise<void> | void;
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

  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || loading) return;

    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMsg('Informe seu nome para criar a conta.');
      return;
    }

    if (mode !== 'reset') {
      if (!password) {
        setErrorMsg('Informe sua senha.');
        return;
      }
      if (mode === 'signup' && password.length < 6) {
        setErrorMsg('A senha precisa ter pelo menos 6 caracteres.');
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(trimmedEmail, password);
        if (res.error || !res.user) {
          setErrorMsg(res.error ?? 'Não foi possível entrar. Verifique seus dados.');
        } else {
          await onAuthenticated(res.user);
        }
      } else if (mode === 'signup') {
        const res = await signUpWithEmail(trimmedEmail, password, name);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          await onAuthenticated(res.user);
        } else if (res.info) {
          setInfoMsg(res.info);
        }
      } else {
        const res = await requestPasswordReset(trimmedEmail);
        if (res.ok) setInfoMsg(res.message);
        else setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg(
        'Ocorreu um erro inesperado ao autenticar. Verifique sua conexão e tente novamente.'
      );
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen min-h-dvh bg-[#080B0E] telemetry-grid-bg text-white flex flex-col justify-between px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onBackToGrid}
          className="inline-flex items-center gap-2 py-1 text-sm text-[#C5CBD0] hover:text-white transition-colors cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 text-[#00D2BE]" />
          <span>Voltar ao Grid de Largada</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto my-6 sm:my-auto relative z-10">
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
              disabled={loading}
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2.5 rounded text-xs font-medium transition-colors cursor-pointer touch-manipulation ${
                mode === 'login'
                  ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                  : 'text-[#C5CBD0] hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className={`py-2.5 rounded text-xs font-medium transition-colors cursor-pointer touch-manipulation ${
                mode === 'signup'
                  ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                  : 'text-[#C5CBD0] hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3.5 rounded bg-red-950/60 border border-red-500/60 text-xs sm:text-sm text-red-100 leading-relaxed"
            >
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="p-3.5 rounded bg-[#080B0E] border border-[#00D2BE]/60 text-xs sm:text-sm text-[#00D2BE] leading-relaxed"
            >
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs text-[#C5CBD0] mb-1.5">
                  Nome
                </label>
                <div className="relative">
                  <User
                    aria-hidden="true"
                    className="pointer-events-none w-4 h-4 text-[#707982] absolute left-3.5 top-1/2 -translate-y-1/2"
                  />
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-base sm:text-sm focus:border-[#00D2BE] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs text-[#C5CBD0] mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="pointer-events-none w-4 h-4 text-[#707982] absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint={mode === 'reset' ? 'go' : 'next'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rebeca@email.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-base sm:text-sm focus:border-[#00D2BE] focus:outline-none"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label htmlFor="auth-pass" className="block text-xs text-[#C5CBD0] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none w-4 h-4 text-[#707982] absolute left-3.5 top-1/2 -translate-y-1/2"
                  />
                  <input
                    id="auth-pass"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-10 pr-12 py-3 rounded bg-[#080B0E] border border-[#707982]/40 text-white text-base sm:text-sm focus:border-[#00D2BE] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-[#707982] hover:text-white cursor-pointer touch-manipulation"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] py-3.5 px-4 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-sm tracking-[0.1em] uppercase hover:bg-[#1de6d2] active:scale-[0.99] transition-all disabled:opacity-65 cursor-pointer touch-manipulation inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading
                  ? mode === 'login'
                    ? 'Entrando...'
                    : mode === 'signup'
                      ? 'Criando conta...'
                      : 'Enviando...'
                  : mode === 'login'
                    ? 'Entrar'
                    : mode === 'signup'
                      ? 'Criar Conta e Começar'
                      : 'Enviar Recuperação'}
              </span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#707982]/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            {mode !== 'reset' ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('reset');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="py-1 text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer touch-manipulation"
              >
                Esqueci minha senha
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className="py-1 text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer touch-manipulation"
              >
                Voltar ao login
              </button>
            )}

            <span className="text-[#707982]">
              {isSupabaseConfigured
                ? 'Supabase Auth conectado'
                : 'Modo local deste aparelho'}
            </span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto text-center text-xs text-[#707982] pb-2">
        REBECA RACING · THE PERFECT SHAPE. THE PERFECT RACE.
      </div>
    </section>
  );
}

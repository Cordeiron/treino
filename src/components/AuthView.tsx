import { useEffect, useRef, useState } from 'react';
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
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if ((errorMsg || infoMsg) && feedbackRef.current) {
      requestAnimationFrame(() => {
        try {
          feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch {
          // Ignora em webviews antigas
        }
      });
    }
  }, [errorMsg, infoMsg]);

  const switchMode = (nextMode: AuthMode) => {
    if (submittingRef.current) return;
    setMode(nextMode);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const runAuthAction = async (overrides?: {
    email?: string;
    password?: string;
    name?: string;
  }) => {
    if (submittingRef.current || loading) return;

    setErrorMsg(null);
    setInfoMsg(null);

    const rawEmail = overrides?.email ?? emailInputRef.current?.value ?? email;
    const rawPassword = overrides?.password ?? passwordInputRef.current?.value ?? password;
    const rawName = overrides?.name ?? nameInputRef.current?.value ?? name;

    if (rawEmail !== email) setEmail(rawEmail);
    if (rawPassword !== password) setPassword(rawPassword);
    if (rawName !== name) setName(rawName);

    const trimmedEmail = rawEmail.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Informe um endereço de e-mail válido.');
      return;
    }

    if (mode === 'signup' && !rawName.trim()) {
      setErrorMsg('Informe seu nome para criar a conta.');
      return;
    }

    if (mode !== 'reset') {
      if (!rawPassword) {
        setErrorMsg('Informe sua senha.');
        return;
      }
      if (mode === 'signup' && rawPassword.length < 6) {
        setErrorMsg('A senha precisa ter entre 6 e 8 caracteres.');
        return;
      }
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInWithEmail(trimmedEmail, rawPassword);
        if (res.error || !res.user) {
          setErrorMsg(res.error ?? 'Não foi possível entrar. Verifique seus dados.');
        } else {
          await onAuthenticated(res.user);
        }
      } else if (mode === 'signup') {
        const res = await signUpWithEmail(trimmedEmail, rawPassword, rawName);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          await onAuthenticated(res.user);
        } else if (res.info) {
          setInfoMsg(res.info);
        } else {
          setErrorMsg('Não foi possível concluir o cadastro. Tente novamente.');
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value.slice(0, 8);
    setPassword(nextVal);
    if (mode === 'login' && nextVal.length === 8) {
      void runAuthAction({ password: nextVal });
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void runAuthAction();
  };

  return (
    <section className="min-h-screen bg-[#080B0E] telemetry-grid-bg text-white flex flex-col justify-start sm:justify-between px-4 sm:px-6 pt-5 pb-12 sm:py-8">
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={onBackToGrid}
          className="inline-flex items-center gap-2 py-1.5 text-sm text-[#C5CBD0] hover:text-white transition-colors cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-4 h-4 text-[#00D2BE]" />
          <span>Voltar ao Grid de Largada</span>
        </button>
      </div>

      <div className="w-full max-w-md mx-auto mt-5 sm:my-auto relative z-10">
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
              onClick={() => switchMode('login')}
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
              onClick={() => switchMode('signup')}
              className={`py-2.5 rounded text-xs font-medium transition-colors cursor-pointer touch-manipulation ${
                mode === 'signup'
                  ? 'bg-[#00D2BE] text-[#080B0E] font-bold'
                  : 'text-[#C5CBD0] hover:text-white'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
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
                    ref={nameInputRef}
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
                  ref={emailInputRef}
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
                  {mode === 'login'
                    ? 'Senha (até 8 dígitos — entra direto no 8º)'
                    : 'Senha (6 a 8 caracteres)'}
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none w-4 h-4 text-[#707982] absolute left-3.5 top-1/2 -translate-y-1/2"
                  />
                  <input
                    ref={passwordInputRef}
                    id="auth-pass"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    maxLength={8}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder={
                      mode === 'login'
                        ? 'Até 8 dígitos (8º entra direto)'
                        : 'Entre 6 e 8 caracteres'
                    }
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

            {(errorMsg || infoMsg) && (
              <div ref={feedbackRef}>
                {errorMsg && (
                  <div
                    role="alert"
                    className="p-3.5 rounded bg-red-950/75 border border-red-500/70 text-xs sm:text-sm text-red-100 leading-relaxed"
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
              </div>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={() => void runAuthAction()}
              className="w-full min-h-[48px] py-3.5 px-4 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-sm tracking-[0.1em] uppercase hover:bg-[#1de6d2] active:opacity-90 transition-colors disabled:opacity-65 cursor-pointer touch-manipulation inline-flex items-center justify-center gap-2 select-none"
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
                onClick={() => switchMode('reset')}
                className="py-1.5 text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer touch-manipulation"
              >
                Esqueci minha senha
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => switchMode('login')}
                className="py-1.5 text-[#C5CBD0] hover:text-[#00D2BE] cursor-pointer touch-manipulation"
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

      <div className="w-full max-w-md mx-auto text-center text-xs text-[#707982] pt-6 pb-2">
        REBECA RACING · THE PERFECT SHAPE. THE PERFECT RACE.
      </div>
    </section>
  );
}

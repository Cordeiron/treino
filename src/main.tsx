import { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado ao carregar a tela.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080B0E] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#151A20] border border-[#00D2BE]/50 rounded-md p-6 space-y-4 text-center">
            <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
              REBECA RACING · RECUPERAÇÃO
            </p>
            <h1 className="font-display text-xl font-bold text-white">
              Algo interrompeu o carregamento
            </h1>
            <p className="text-xs text-[#C5CBD0] break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded bg-[#00D2BE] text-[#080B0E] font-display text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);

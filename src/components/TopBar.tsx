import { NavSection } from '../types/racing';

interface TopBarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenGarage3D: () => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string }> = [
  { id: NavSection.INICIO, label: 'Início' },
  { id: NavSection.MEU_TREINO, label: 'Meu treino' },
  { id: NavSection.CALENDARIO, label: 'Calendário' },
  { id: NavSection.MINHA_EVOLUCAO, label: 'Minha evolução' },
  { id: NavSection.RECADOS_NAUHAN, label: 'Recados do Nauhan' },
  { id: NavSection.MEU_PERFIL, label: 'Meu perfil' },
];

export function TopBar({
  activeSection,
  onSelectSection,
  onOpenGarage3D,
}: TopBarProps) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#080B0E]/95 border-b border-[#707982]/25">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onSelectSection(NavSection.INICIO)}
            className="font-display text-base sm:text-lg font-bold tracking-[0.14em] text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            REBECA RACING
          </button>

          {/* Zone 2: Exact 6 Navigation Sections */}
          <nav
            className="hidden lg:flex items-center gap-6"
            aria-label="Navegação principal"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#707982] hover:text-[#C5CBD0]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#00D2BE]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (3D Garage Showroom) */}
          <button
            type="button"
            onClick={onOpenGarage3D}
            className={`px-4 py-2 rounded border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === NavSection.GARAGEM_3D
                ? 'bg-[#00D2BE] border-[#00D2BE] text-[#080B0E] font-semibold'
                : 'bg-[#151A20] border-[#707982]/40 hover:border-[#00D2BE] text-white'
            }`}
          >
            Garagem 3D
          </button>
        </div>
      </header>

      {/* Compact Mobile Bottom Navigation Bar (<= 15% viewport height) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080B0E] border-t border-[#707982]/30 grid grid-cols-6"
        aria-label="Navegação mobile"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          const mobileShortLabel =
            item.id === NavSection.MINHA_EVOLUCAO
              ? 'Evolução'
              : item.id === NavSection.RECADOS_NAUHAN
                ? 'Recados'
                : item.id === NavSection.MEU_PERFIL
                  ? 'Perfil'
                  : item.id === NavSection.MEU_TREINO
                    ? 'Treino'
                    : item.label;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`py-3 px-1 text-[11px] font-medium text-center truncate cursor-pointer border-t-2 transition-colors ${
                isActive
                  ? 'text-[#00D2BE] border-[#00D2BE]'
                  : 'text-[#707982] border-transparent'
              }`}
            >
              {mobileShortLabel}
            </button>
          );
        })}
      </nav>
    </>
  );
}

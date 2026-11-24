import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Radio, Sparkles } from 'lucide-react';
import {
  DAILY_NAUHAN_MESSAGES,
  getDailyMuscleTip,
  getDailyNauhanMessage,
  MUSCLE_GROUP_LABELS,
  NAUHAN_MUSCLE_TIPS,
} from '../data/nauhanMessages';
import { MuscleTipGroup } from '../types/racing';

const ALL_GROUPS = Object.keys(NAUHAN_MUSCLE_TIPS) as MuscleTipGroup[];

export function NauhanMessagesView() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyMessage = useMemo(() => getDailyNauhanMessage(todayStr), [todayStr]);
  const [selectedGroup, setSelectedGroup] = useState<MuscleTipGroup | 'todos'>('todos');
  const [expandedGroup, setExpandedGroup] = useState<MuscleTipGroup | null>(null);

  const visibleGroups =
    selectedGroup === 'todos' ? ALL_GROUPS : [selectedGroup];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-24 lg:pb-10 space-y-8">
      <div className="pb-6 border-b border-[#707982]/25">
        <p className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
          RÁDIO PESSOAL EXCLUSIVO
        </p>
        <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-white">
          Recados do Nauhan ❤️
        </h1>
        <p className="mt-1 text-sm text-[#C5CBD0]">
          Mensagens diárias e dicas especiais por grupo muscular feitas só para você, Rebeca.
        </p>
      </div>

      {/* UMA MENSAGEM DO NAUHAN ❤️ */}
      <div className="bg-[#151A20] border border-[#00D2BE] rounded-md p-6 sm:p-8 shadow-[0_0_24px_rgba(0,210,190,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-[#00D2BE]" />
            <span className="font-mono-telemetry text-xs tracking-[0.18em] text-[#00D2BE] uppercase">
              UMA MENSAGEM DO NAUHAN ❤️
            </span>
          </div>
          <span className="font-mono-telemetry text-xs text-[#707982]">
            Recado #{dailyMessage.index + 1} de {DAILY_NAUHAN_MESSAGES.length} · {todayStr}
          </span>
        </div>

        <blockquote className="mt-5 text-xl sm:text-2xl font-medium text-white leading-relaxed">
          &ldquo;{dailyMessage.text}&rdquo;
        </blockquote>
        <p className="mt-3 font-mono-telemetry text-sm text-[#00D2BE]">
          — Nauhan ❤️
        </p>
      </div>

      {/* DICAS DO NAUHAN ❤️ — 10 Grupos Musculares */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-mono-telemetry text-xs text-[#00D2BE] uppercase">
              DICAS DO NAUHAN ❤️ · POR GRUPO MUSCULAR
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-white">
              Comentários de Hoje & Frases Especiais
            </h2>
          </div>

          <select
            aria-label="Filtrar grupo muscular"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value as MuscleTipGroup | 'todos')}
            className="px-3.5 py-2 rounded bg-[#151A20] border border-[#707982]/40 text-sm text-white focus:border-[#00D2BE] focus:outline-none"
          >
            <option value="todos">Todos os 10 grupos musculares</option>
            {ALL_GROUPS.map((grp) => (
              <option key={grp} value={grp}>
                {MUSCLE_GROUP_LABELS[grp]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleGroups.map((grp) => {
            const todayTip = getDailyMuscleTip(grp, todayStr);
            const allMessages = NAUHAN_MUSCLE_TIPS[grp];
            const originalMsg = allMessages.find((m) => m.isOriginal);
            const isExpanded = expandedGroup === grp;

            return (
              <div
                key={grp}
                className="bg-[#151A20] border border-[#707982]/30 rounded-md p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#00D2BE]" />
                      <h3 className="font-display text-lg font-bold text-white">
                        {MUSCLE_GROUP_LABELS[grp]}
                      </h3>
                    </div>
                    <span className="font-mono-telemetry text-xs text-[#707982]">
                      {allMessages.length} recados
                    </span>
                  </div>

                  {/* Highlighted Original Phrase */}
                  {originalMsg && (
                    <div className="p-3.5 rounded bg-[#080B0E] border border-[#00D2BE]/40">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono-telemetry text-[#00D2BE] uppercase">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Frase Clássica do Nauhan</span>
                      </div>
                      <p className="mt-1.5 text-sm text-white leading-relaxed">
                        &ldquo;{originalMsg.text}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Deterministic Today's Tip (when different from original) */}
                  {todayTip.text !== originalMsg?.text && (
                    <div>
                      <p className="text-[11px] font-mono-telemetry text-[#707982] uppercase">
                        Destaque de hoje
                      </p>
                      <p className="mt-1 text-sm text-[#C5CBD0] leading-relaxed">
                        &ldquo;{todayTip.text}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isExpanded ? null : grp)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00D2BE] hover:text-white cursor-pointer"
                  >
                    <span>
                      {isExpanded
                        ? 'Ocultar lista completa'
                        : `Ver todas as ${allMessages.length} dicas de ${MUSCLE_GROUP_LABELS[grp]}`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isExpanded && (
                    <ul className="mt-3 pt-3 border-t border-[#707982]/20 space-y-2 text-xs text-[#C5CBD0]">
                      {allMessages.map((msg, i) => (
                        <li key={i} className="leading-relaxed">
                          <span className="font-mono-telemetry text-[#00D2BE] mr-2">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          &ldquo;{msg.text}&rdquo;
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

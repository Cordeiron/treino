import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GOAL_OPTIONS } from '../data/exercisesLibrary';
import { FitnessGoal } from '../types/racing';

interface GoalSelectionProps {
  selectedGoal: FitnessGoal | null;
  onSelectGoal: (goal: FitnessGoal) => void;
  onBack: () => void;
}

export function GoalSelection({ selectedGoal, onSelectGoal, onBack }: GoalSelectionProps) {
  const [pickedGoal, setPickedGoal] = useState<FitnessGoal | null>(selectedGoal);

  const selectedOption = GOAL_OPTIONS.find((g) => g.id === pickedGoal) ?? null;

  return (
    <section className="min-h-screen bg-[#080B0E] telemetry-grid-bg text-white flex flex-col">
      <div className="w-full max-w-6xl mx-auto px-6 py-8 sm:py-12 flex-1 flex flex-col">
        {/* Top step breadcrumb */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#707982]/25">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-[#C5CBD0] hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#00D2BE]" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center gap-3 text-xs font-mono-telemetry text-[#707982]">
            <span className="text-[#00D2BE]">Escolha do Objetivo</span>
            <span aria-hidden="true">/</span>
            <span>Setup Inicial</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mt-8 mb-8 max-w-2xl">
          <p className="text-xs font-mono-telemetry tracking-[0.2em] text-[#00D2BE] uppercase">
            Estratégia da Temporada
          </p>
          <h1
            className="mt-2 font-display font-bold text-white tracking-tight"
            style={{ fontSize: 'clamp(1.85rem, 3.6vw, 3rem)', textWrap: 'balance' }}
          >
            Qual é a sua próxima meta?
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#C5CBD0]">
            Selecione um dos quatro objetivos abaixo para ver o comentário do Nauhan e calibrar seu plano de treinos.
          </p>
        </div>

        {/* 4 Exact Goal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GOAL_OPTIONS.map((goal) => {
            const isSelected = pickedGoal === goal.id;
            return (
              <motion.button
                key={goal.id}
                type="button"
                whileTap={{ scale: 0.985 }}
                animate={
                  isSelected
                    ? { scale: 1.01, borderColor: '#00D2BE' }
                    : { scale: 1, borderColor: 'rgba(112, 121, 130, 0.25)' }
                }
                transition={{ duration: 0.18 }}
                onClick={() => setPickedGoal(goal.id)}
                className={`group text-left rounded-md overflow-hidden border transition-shadow duration-200 cursor-pointer flex flex-col bg-[#151A20] ${
                  isSelected
                    ? 'shadow-[0_0_28px_rgba(0,210,190,0.22)]'
                    : 'hover:border-[#C5CBD0]/60'
                }`}
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#080B0E]">
                  <img
                    src={goal.imageUrl}
                    alt={goal.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#151A20] via-[#151A20]/30 to-transparent"
                  />
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="font-mono-telemetry text-xs tracking-widest text-[#C5CBD0]">
                      {goal.code} — {goal.title} {goal.emoji}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00D2BE] text-[#080B0E] font-display text-xs font-bold uppercase tracking-wider">
                        <Check className="w-3.5 h-3.5" />
                        Selecionado
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      {goal.code} — {goal.title} {goal.emoji}
                    </h2>
                    <p className="mt-2.5 text-sm text-[#C5CBD0] leading-relaxed">
                      {goal.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#707982]/20 flex items-center justify-between text-xs">
                    <span className="text-[#707982]">Toque para selecionar</span>
                    <span
                      className={`font-display font-semibold uppercase tracking-wider ${
                        isSelected ? 'text-[#00D2BE]' : 'text-[#C5CBD0] group-hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Escolhido' : 'Selecionar'}
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Highlighted Nauhan Comment before advancing */}
        <AnimatePresence mode="wait">
          {selectedOption ? (
            <motion.div
              key={selectedOption.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="mt-8 p-6 rounded-md bg-[#151A20] border border-[#00D2BE] shadow-[0_0_24px_rgba(0,210,190,0.14)] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 max-w-2xl">
                <div className="w-11 h-11 rounded bg-[#080B0E] border border-[#00D2BE]/50 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 text-[#00D2BE]" />
                </div>
                <div>
                  <p className="text-xs font-mono-telemetry text-[#00D2BE] uppercase">
                    COMENTÁRIO DO NAUHAN · {selectedOption.code} — {selectedOption.title} {selectedOption.emoji}
                  </p>
                  <p className="mt-2 text-base sm:text-lg font-medium text-white leading-relaxed">
                    &ldquo;{selectedOption.nauhanComment}&rdquo;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectGoal(selectedOption.id)}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded bg-[#00D2BE] text-[#080B0E] font-display font-bold text-sm tracking-[0.1em] uppercase hover:bg-[#1de6d2] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Avançar para Perfil</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <div className="mt-8 p-6 rounded-md bg-[#151A20] border border-[#707982]/30 text-center text-sm text-[#C5CBD0]">
              Selecione um dos objetivos acima para desbloquear o comentário do Nauhan e continuar.
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

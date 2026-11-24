import { DailyMoodId, MuscleTipGroup } from '../types/racing';

export interface MuscleTipMessage {
  text: string;
  isOriginal?: boolean;
}

export const MUSCLE_GROUP_LABELS: Record<MuscleTipGroup, string> = {
  costas: 'Costas',
  bracos: 'Braços',
  gluteos: 'Glúteos',
  pernas: 'Pernas',
  abdomen: 'Abdômen',
  ombros: 'Ombros',
  quadriceps: 'Quadríceps',
  posterior_coxa: 'Posterior de Coxa',
  panturrilhas: 'Panturrilhas',
  peito: 'Peito',
};

/**
 * DICAS DO NAUHAN ❤️ — Biblioteca de comentários por grupo muscular.
 * As 4 frases originais são preservadas integralmente com `isOriginal: true`.
 */
export const NAUHAN_MUSCLE_TIPS: Record<MuscleTipGroup, MuscleTipMessage[]> = {
  costas: [
    { text: 'Postura de princesa exige costas fortes e alinhadas.', isOriginal: true },
    { text: 'Costas fortes e postura impecável deixam sua presença ainda mais marcante.' },
    { text: 'Costas desenhadas deixam qualquer caminhar teu ainda mais impossível de ignorar.' },
    { text: 'Puxa firme que a postura de quem manda no pedaço já vem de fábrica em você.' },
    { text: 'É muita beleza para pouco espaço na academia.' },
    { text: 'Quando você fecha as escápulas desse jeito, dá vontade de aplaudir da arquibancada.' },
    { text: 'Se depender dos meus elogios, você nunca vai faltar no treino de costas.' },
    { text: 'Pode reclamar do treino, mas não dos elogios.' },
    { text: 'Tem gente que vai à academia para ficar bonita. Você já começa com vantagem.' },
    { text: 'Treinando costas assim você vai deixar todo mundo olhando duas vezes quando passar.' },
  ],
  bracos: [
    { text: 'Força porque segurar a barra que é ser perfeita não é fácil.', isOriginal: true },
    { text: 'Braço firme e definido combina demais com você dando tchauzinho cheia de estilo.' },
    { text: 'Pode fazer careta na última repetição que até assim você continua linda.' },
    { text: 'Eu poderia fazer um comentário técnico aqui, mas prefiro só ficar te admirando.' },
    { text: 'Se a barra parecer pesada, lembra que você carrega minha atenção o dia inteiro.' },
    { text: 'Cada repetição firme nos braços mostra o quanto você se dedica sem perder o charme.' },
    { text: 'Bíceps e tríceps em dia para carregar tantos elogios que eu mando.' },
    { text: 'Controle na descida, charme na subida. Você domina isso fácil.' },
    { text: 'Pode reclamar do peso do halter, mas esse esforço fica absurdo em você.' },
    { text: 'Cada série de braço aqui é só mais um motivo pra eu me gabar de você.' },
  ],
  gluteos: [
    { text: 'Gosto muito.', isOriginal: true },
    { text: 'Eu poderia fazer um comentário técnico, mas prefiro dizer que gosto muito.' },
    { text: 'Sem pressa nenhuma hoje. Capricha nesse movimento que eu aprovo 100%.' },
    { text: 'Se eu disser que esse é meu grupo muscular favorito do seu treino, você finge surpresa?' },
    { text: 'Foco total aqui, Rebeca. Esse resultado merece toda a atenção do mundo.' },
    { text: 'Não sei o que é mais difícil: contar suas séries ou disfarçar que gosto muito.' },
    { text: 'Tem dias que o treino pede técnica. Esse aqui pede técnica e muita admiração da minha parte.' },
    { text: 'Sério, parabéns pela dedicação… e pelo resultado também. Gosto muito.' },
    { text: 'Pode colocar mais carga se aguentar, porque talento natural aqui já sobra.' },
    { text: 'É muita perfeição junta. Continua firme nesse set que tá espetacular.' },
  ],
  pernas: [
    { text: 'Porque são elas que mantêm toda essa perfeição em pé.', isOriginal: true },
    { text: 'Dia de perna não é fácil, mas você saindo andando plena depois vale cada gota de suor.' },
    { text: 'Tem gente que foge do treino de pernas. Você encara de frente e ainda fica mais linda.' },
    { text: 'Base forte, equilíbrio absurdo e uma presença que para a academia inteira.' },
    { text: 'Se amanhã estiver difícil subir escada, me avisa que eu carrego você no colo.' },
    { text: 'É muita beleza para pouco espaço na academia.' },
    { text: 'Cada repetição bem feita aqui deixa o conjunto todo ainda mais surreal.' },
    { text: 'Pode reclamar do treino, mas não dos elogios.' },
    { text: 'Pernas fortes para você continuar pisando firme por onde passa.' },
    { text: 'Você concentrada no treino de perna é uma das coisas mais bonitas de ver.' },
  ],
  abdomen: [
    { text: 'Até a perfeição precisa de uma estrutura forte.', isOriginal: true },
    { text: 'Eu sei que a prancha faz o tempo passar em câmera lenta, mas você aguenta firme!' },
    { text: 'Core blindado, cintura desenhada e zero desculpa para pular o último exercício.' },
    { text: 'Respira fundo e segura: cada segundo aqui vale ouro.' },
    { text: 'Não sei como você consegue continuar com a postura impecável até ardendo o abdômen.' },
    { text: 'Se depender dos meus elogios, você nunca vai faltar no treino de abdômen.' },
    { text: 'Pode fazer cara de brava pra mim na última série que mesmo assim eu acho linda.' },
    { text: 'Firmeza no centro do corpo, leveza em tudo ao redor.' },
    { text: 'Tem gente que vai à academia para ficar bonita. Você já começa com vantagem.' },
    { text: 'Mais uma série limpa de abdômen e você já pode sair desfilando.' },
  ],
  ombros: [
    { text: 'Para carregar toda essa beleza, precisa ter estrutura.', isOriginal: true },
    { text: 'Ombro desenhado dá um destaque absurdo em qualquer roupa que você escolher.' },
    { text: 'Sobe controlando que a elegância desse movimento combina demais com você.' },
    { text: 'Eu poderia falar sobre deltoide, mas prefiro dizer que você fica incrível treinando.' },
    { text: 'Se queimar na elevação lateral, sorri — quer dizer que tá funcionando.' },
    { text: 'Ombros firmes e alinhados dão ainda mais destaque ao seu porte.' },
    { text: 'Postura alta, ombros firmes e confiança lá no teto.' },
    { text: 'Pode reclamar do treino, mas não dos elogios.' },
    { text: 'Você cuidando dos ombros assim deixa a silhueta simplesmente perfeita.' },
    { text: 'Falta pouco pra terminar essa série e eu já tô orgulhoso.' },
  ],
  quadriceps: [
    { text: 'Não é fácil sustentar tanta perfeição.', isOriginal: true },
    { text: 'Quadríceps trabalhando forte hoje — e a determinação no seu olhar tá dando aula.' },
    { text: 'Desce com controle e sobe sabendo que ninguém segura você quando foca.' },
    { text: 'Se tremer a perna na última série, é sinal de que a volta rápida foi de verdade.' },
    { text: 'É muita beleza para pouco espaço na academia.' },
    { text: 'Cada série aqui deixa suas pernas ainda mais desenhadas e fortes.' },
    { text: 'Pode fazer careta na extensora, eu finjo que não vi e continuo te achando perfeita.' },
    { text: 'Não tem erro quando você entra concentrada desse jeito.' },
    { text: 'Tem gente que vai à academia para ficar bonita. Você já começa com vantagem.' },
    { text: 'Se depender dos meus elogios, você nunca vai pular dia de quadríceps.' },
  ],
  posterior_coxa: [
    { text: 'Não adianta cuidar só da frente. Eu gosto do conjunto completo.', isOriginal: true },
    { text: 'Posterior forte muda todo o desenho da perna — e eu reparo em cada detalhe.' },
    { text: 'Movimento bem alongado e postura limpa: você fazendo Stiff é pura elegância.' },
    { text: 'Eu poderia fazer um comentário técnico, mas prefiro dizer que gosto muito.' },
    { text: 'Equilíbrio de frente e verso porque perfeição se constrói por inteiro.' },
    { text: 'Cada série de posterior aqui valoriza ainda mais a sua dedicação no conjunto inteiro.' },
    { text: 'Pode caprichar na descida controlada que o resultado aparece rápido.' },
    { text: 'A disciplina que você coloca nos detalhes faz toda a diferença.' },
    { text: 'Se sentir puxar bem atrás da coxa, acertou em cheio a execução.' },
    { text: 'Foco total! Esse conjunto completo merece nota dez.' },
  ],
  panturrilhas: [
    { text: 'Os detalhes também fazem toda a diferença.', isOriginal: true },
    { text: 'Pouca gente tem paciência pra treinar panturrilha direito, mas você capricha em tudo.' },
    { text: 'Pausa lá embaixo e sobe firme — elegância até nos mínimos detalhes.' },
    { text: 'Se depender dos meus elogios, você nunca vai pular nem a panturrilha.' },
    { text: 'É no acabamento fino que você deixa qualquer padrão no chinelo.' },
    { text: 'Pode parecer rápido, mas faz uma diferença gigante no visual da perna inteira.' },
    { text: 'Tem gente que vai à academia para ficar bonita. Você já começa com vantagem.' },
    { text: 'Até na panturrilha você consegue manter classe e foco.' },
    { text: 'Último toque de acabamento da parte inferior. Vai com tudo!' },
    { text: 'Caprichar até na panturrilha mostra o quanto você leva seu treino a sério.' },
  ],
  peito: [
    { text: 'Aqui não existe favoritismo. Tudo merece atenção.', isOriginal: true },
    { text: 'Treino completo de verdade não pula nada — e você entrega excelência em tudo.' },
    { text: 'Postura alinhada, ombros saudáveis e força proporcional no corpo todo.' },
    { text: 'Pode reclamar do treino, mas não dos elogios.' },
    { text: 'Cada repetição controlada deixa seu tronco mais firme e elegante.' },
    { text: 'Eu poderia fazer um comentário técnico, mas prefiro admirar sua constância.' },
    { text: 'Força e equilíbrio andando juntos, exatamente como tem que ser.' },
    { text: 'É muita beleza para pouco espaço na academia.' },
    { text: 'Mantém a escápula firme no banco e mostra quem manda nessa série.' },
    { text: 'Se depender dos meus elogios, você fecha esse treino sorrindo.' },
  ],
};

/**
 * RECADO DO DIA — UMA MENSAGEM DO NAUHAN (32 mensagens pessoais exclusivas).
 */
export const DAILY_NAUHAN_MESSAGES: string[] = [
  'Entre tantos motivos para sorrir, espero ser um deles.',
  'Não sei se você percebe, mas até quando está focada no treino consegue chamar minha atenção.',
  'Hoje é dia de cuidar de você. E eu gosto muito disso.',
  'Você pode até não perceber sua evolução, mas espero que nunca deixe de reconhecer seu valor.',
  'Uma coisa é certa: minha torcida por você não depende do resultado.',
  'Não vou cobrar perfeição. Essa parte você já resolveu.',
  'Eu poderia ficar horas falando sobre sua beleza, mas hoje temos treino.',
  'Mesmo nos dias corridos, você reserva um tempo para ficar ainda melhor — e isso me faz te admirar mais.',
  'Se alguém perguntar quem tem o melhor sorriso da academia inteira, eu já tenho a resposta pronta.',
  'Vai no seu ritmo hoje, Rebeca. O importante é não esquecer o quanto você é especial.',
  'Você tem um jeito único de transformar disciplina em coisa bonita de se ver.',
  'Não existe treino ruim quando você aparece e ilumina o dia inteiro.',
  'Se o peso parecer pesado hoje, lembra que eu tô aqui torcendo por cada repetição sua.',
  'Tem gente que treina para impressionar os outros. Você já impressiona só de existir.',
  'Cuida do corpo, bebe água e não esquece de descansar — quero você bem em todos os sentidos.',
  'A parte mais fácil desse aplicativo inteiro foi pensar em elogios sinceros pra você.',
  'Cada treino concluído aqui é mais uma prova da mulher incrível e determinada que você é.',
  'Se hoje a preguiça bater, faz pelo menos a metade — já é muito melhor do que desistir.',
  'Eu posso até brincar com você nos comentários, mas a verdade é que você me surpreende todo dia.',
  'Beleza chama atenção, mas a sua força e o seu jeito de levar a vida conquistam de verdade.',
  'Não importa o quanto você evolua no espelho, pra mim você já ganhou na largada.',
  'Hoje o pit wall inteiro está trabalhando por um único objetivo: ver você feliz e orgulhosa de si.',
  'Se precisar de um motivo extra pra treinar bem hoje, lembra que tem alguém bem bobo por você aqui.',
  'Não compara seu ritmo com o de ninguém. A sua corrida é única e você está indo muito bem.',
  'Tomara que o seu dia hoje seja tão leve e bonito quanto você.',
  'Até no dia de descanso eu faço questão de deixar registrado: gosto muito de você, Rebeca.',
  'Foco no treino, sorriso no rosto e zero cobrança exagerada. Combinado?',
  'Você merece sentir orgulho de cada pequena conquista sua — eu já sinto muito.',
  'Se a academia fosse uma corrida de Fórmula 1, você já largava na pole position todo dia.',
  'Cuidar de si mesma é um ato de carinho próprio. E eu adoro acompanhar você fazendo isso.',
  'Hoje não precisa provar nada pra ninguém, só aproveitar o seu momento.',
  'Independente do treino de hoje, lembra sempre: eu gosto muito, muito de você.',
];

export interface CheckinOption {
  id: DailyMoodId;
  label: string;
  energyLabel: string;
  nauhanReply: string;
}

export const DAILY_CHECKIN_OPTIONS: CheckinOption[] = [
  {
    id: 'maravilhosa',
    label: 'Estou maravilhosa!',
    energyLabel: 'Energia Alta · Pole Position',
    nauhanReply:
      'Maravilhosa você já é, agora vamos ver se está disposta a treinar! 😂 Brincadeiras à parte, aproveita essa vibe e faz um treino lindo hoje.',
  },
  {
    id: 'cansada',
    label: 'Estou cansada.',
    energyLabel: 'Energia Moderada/Baixa',
    nauhanReply:
      'Tudo bem estar cansada, Rebeca. Faz um aquecimento caprichado, reduz um pouco as cargas se precisar e vai no seu ritmo. Só de ir cuidar de você já vale demais.',
  },
  {
    id: 'sem_motivacao',
    label: 'Estou sem motivação.',
    energyLabel: 'Foco em Constância',
    nauhanReply:
      'Sem motivação? Tudo bem. Um passo de cada vez. Faz só os dois primeiros exercícios com calma que o ritmo vem — e eu tô aqui na torcida por você.',
  },
  {
    id: 'cheia_energia',
    label: 'Estou cheia de energia!',
    energyLabel: 'Modo Classificação · Q3',
    nauhanReply:
      'Essa energia toda precisa ser aproveitada! Hoje é dia de colocar música boa, caprichar na postura e buscar aquela volta rápida no treino.',
  },
  {
    id: 'preciso_descansar',
    label: 'Hoje preciso descansar.',
    energyLabel: 'Pit Stop Regenerativo',
    nauhanReply:
      'Então hoje vamos respeitar seu corpo. Até piloto precisa de manutenção. Descansa, dorme bem, bebe água e amanhã você volta inteira.',
  },
];

function getEpochDayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/**
 * Retorna a dica do dia para um grupo muscular.
 * Determinística por data, nunca repete em dias seguidos e preserva as 4 frases originais em destaque.
 */
export function getDailyMuscleTip(
  group: MuscleTipGroup,
  dateStr: string = new Date().toISOString().slice(0, 10)
): MuscleTipMessage {
  const list = NAUHAN_MUSCLE_TIPS[group];
  const dayNum = getEpochDayNumber(dateStr);
  // Offset fixo por grupo para que grupos diferentes não caiam no mesmo índice simultaneamente
  const groupOffset = Object.keys(NAUHAN_MUSCLE_TIPS).indexOf(group) * 3;
  const idx = Math.abs(dayNum + groupOffset) % list.length;
  return list[idx];
}

/**
 * Retorna o recado do dia do Nauhan (32+ mensagens sem repetir enquanto houver novas).
 */
export function getDailyNauhanMessage(
  dateStr: string = new Date().toISOString().slice(0, 10)
): { index: number; text: string } {
  const dayNum = getEpochDayNumber(dateStr);
  const index = Math.abs(dayNum) % DAILY_NAUHAN_MESSAGES.length;
  return {
    index,
    text: DAILY_NAUHAN_MESSAGES[index],
  };
}

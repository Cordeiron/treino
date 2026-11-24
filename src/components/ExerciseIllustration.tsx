import { ExerciseIllustrationKey } from '../types/racing';

interface ExerciseIllustrationProps {
  illustrationKey: ExerciseIllustrationKey;
  title?: string;
  className?: string;
}

export function ExerciseIllustration({
  illustrationKey,
  title,
  className = '',
}: ExerciseIllustrationProps) {
  const renderDiagram = () => {
    switch (illustrationKey) {
      case 'hip_thrust':
        return (
          <>
            {/* Bench */}
            <rect x="24" y="64" width="42" height="32" rx="3" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            {/* Floor */}
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Starting hip dip (dashed) */}
            <path d="M58 66 L102 88 L138 68 L142 98" fill="none" stroke="#707982" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Peak thrust posture */}
            <circle cx="52" cy="52" r="7" fill="#C5CBD0" />
            <path d="M58 58 L104 60 L138 62 L140 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Glute highlight & barbell */}
            <circle cx="96" cy="60" r="8" fill="#00D2BE" fillOpacity="0.35" stroke="#00D2BE" strokeWidth="1.5" />
            <circle cx="102" cy="54" r="9" fill="#151A20" stroke="#C5CBD0" strokeWidth="2" />
            <circle cx="102" cy="54" r="2.5" fill="#00D2BE" />
            {/* Upward arrow */}
            <path d="M104 82 L104 68 M99 72 L104 66 L109 72" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'bulgarian_squat':
        return (
          <>
            {/* Rear bench */}
            <rect x="26" y="70" width="38" height="28" rx="3" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Body in split squat */}
            <circle cx="108" cy="24" r="7" fill="#C5CBD0" />
            <path d="M106 32 L100 62 L126 70 L126 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M100 62 L74 72 L52 70" fill="none" stroke="#C5CBD0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dumbbells */}
            <path d="M104 38 L108 64" fill="none" stroke="#C5CBD0" strokeWidth="3" strokeLinecap="round" />
            <rect x="103" y="64" width="12" height="5" rx="1.5" fill="#00D2BE" />
            {/* Target glute/quad zone & arrow */}
            <circle cx="102" cy="62" r="7" fill="#00D2BE" fillOpacity="0.35" stroke="#00D2BE" strokeWidth="1.5" />
            <path d="M148 48 L148 72 M143 66 L148 73 L153 66" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        );

      case 'stiff_rdl':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Upright start dashed */}
            <path d="M96 24 L96 58 L96 96" fill="none" stroke="#707982" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
            {/* Hip hinge posture */}
            <circle cx="130" cy="48" r="7" fill="#C5CBD0" />
            <path d="M124 52 L84 56 L92 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Arms holding barbell close to shins */}
            <path d="M118 54 L108 82" fill="none" stroke="#C5CBD0" strokeWidth="3" strokeLinecap="round" />
            <circle cx="108" cy="84" r="7" fill="#151A20" stroke="#C5CBD0" strokeWidth="2" />
            {/* Posterior highlight */}
            <path d="M84 56 Q80 74 88 86" fill="none" stroke="#00D2BE" strokeWidth="3" strokeLinecap="round" />
            {/* Hinge arrow */}
            <path d="M68 42 Q62 56 72 68" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
            <path d="M67 66 L73 69 L74 62" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'abductor_machine':
        return (
          <>
            {/* Machine seat & back */}
            <path d="M64 36 L68 70 L108 70" fill="none" stroke="#707982" strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Person seated front/angled view */}
            <circle cx="100" cy="28" r="7" fill="#C5CBD0" />
            <path d="M100 36 L100 66" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            {/* Legs opening outward */}
            <path d="M100 66 L70 78 L72 96" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M100 66 L130 78 L128 96" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Outward abduction arrows */}
            <path d="M82 82 L58 82 M63 77 L57 82 L63 87" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
            <path d="M118 82 L142 82 M137 77 L143 82 L137 87" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'cable_kickback':
        return (
          <>
            {/* Cable tower */}
            <rect x="34" y="18" width="10" height="80" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Athlete leaning slightly holding tower */}
            <circle cx="78" cy="34" r="7" fill="#C5CBD0" />
            <path d="M74 42 L50 48" fill="none" stroke="#C5CBD0" strokeWidth="3" strokeLinecap="round" />
            <path d="M78 42 L94 64 L94 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Kicking leg back */}
            <path d="M94 64 L138 56" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            {/* Cable line */}
            <line x1="44" y1="88" x2="138" y2="56" stroke="#00D2BE" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="96" cy="62" r="7" fill="#00D2BE" fillOpacity="0.35" stroke="#00D2BE" strokeWidth="1.5" />
            <path d="M126 72 Q144 64 148 48" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'barbell_squat':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Standing start dashed */}
            <path d="M100 22 L100 58 L100 96" fill="none" stroke="#707982" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
            {/* Squat bottom posture */}
            <circle cx="106" cy="40" r="7" fill="#C5CBD0" />
            <path d="M102 48 L84 68 L116 74 L106 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Barbell on upper back */}
            <circle cx="96" cy="46" r="8" fill="#151A20" stroke="#00D2BE" strokeWidth="2" />
            <path d="M138 38 L138 66 M133 60 L138 67 L143 60" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'leg_press':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* 45 degree sled track */}
            <line x1="78" y1="74" x2="152" y2="26" stroke="#707982" strokeWidth="3" strokeLinecap="round" />
            {/* Seat */}
            <path d="M36 52 L54 78 L80 78" fill="none" stroke="#707982" strokeWidth="4" strokeLinecap="round" />
            {/* Seated athlete pushing sled */}
            <circle cx="48" cy="42" r="7" fill="#C5CBD0" />
            <path d="M52 48 L74 74 L106 58 L132 42" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Footplate */}
            <line x1="124" y1="30" x2="144" y2="52" stroke="#00D2BE" strokeWidth="4" strokeLinecap="round" />
            <path d="M114 48 L132 36 M125 35 L133 35 L131 43" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'leg_extension':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <path d="M54 38 L60 70 L96 70" fill="none" stroke="#707982" strokeWidth="4" strokeLinecap="round" />
            {/* Start vertical shin dashed */}
            <path d="M96 70 L96 94" fill="none" stroke="#707982" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
            {/* Extended leg */}
            <circle cx="64" cy="28" r="7" fill="#C5CBD0" />
            <path d="M64 36 L68 68 L96 68 L142 66" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="136" cy="70" r="4.5" fill="#00D2BE" />
            <path d="M108 92 Q132 88 142 74" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'leg_curl':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Prone bench */}
            <rect x="44" y="68" width="96" height="8" rx="3" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            {/* Extended start dashed */}
            <path d="M102 64 L148 64" fill="none" stroke="#707982" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
            {/* Curled leg */}
            <circle cx="50" cy="54" r="7" fill="#C5CBD0" />
            <path d="M58 60 L108 62 L134 36" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="130" cy="42" r="4.5" fill="#00D2BE" />
            <path d="M150 58 Q152 44 138 36" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'calf_raise':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Step block */}
            <rect x="78" y="84" width="42" height="14" rx="2" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            <circle cx="96" cy="20" r="7" fill="#C5CBD0" />
            <path d="M96 28 L96 58 L96 76 L104 84" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Heel drop dashed */}
            <path d="M96 76 L86 92" fill="none" stroke="#707982" strokeWidth="2.5" strokeDasharray="3 3" strokeLinecap="round" />
            <circle cx="96" cy="68" r="6" fill="#00D2BE" fillOpacity="0.35" stroke="#00D2BE" strokeWidth="1.5" />
            <path d="M132 76 L132 54 M127 60 L132 53 L137 60" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'lat_pulldown':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <rect x="80" y="72" width="38" height="26" rx="3" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            {/* Top cable pulley */}
            <line x1="99" y1="8" x2="99" y2="30" stroke="#00D2BE" strokeWidth="2" />
            <line x1="64" y1="30" x2="134" y2="30" stroke="#C5CBD0" strokeWidth="3.5" strokeLinecap="round" />
            {/* Athlete seated */}
            <circle cx="99" cy="40" r="7" fill="#C5CBD0" />
            <path d="M99 48 L99 72 L124 76 L124 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Arms pulling bar down */}
            <path d="M92 50 L72 30" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M106 50 L126 30" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M148 30 L148 52 M143 46 L148 53 L153 46" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'seated_row':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <rect x="38" y="76" width="52" height="22" rx="3" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            {/* Cable machine */}
            <rect x="150" y="22" width="12" height="76" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            <line x1="150" y1="54" x2="92" y2="54" stroke="#00D2BE" strokeWidth="2" />
            {/* Seated athlete */}
            <circle cx="62" cy="34" r="7" fill="#C5CBD0" />
            <path d="M64 42 L64 72 L114 76 L144 68" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M64 46 L86 56 L94 54" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M104 42 L78 42 M84 37 L77 42 L84 47" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'shoulder_press':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <path d="M74 38 L78 72 L112 72" fill="none" stroke="#707982" strokeWidth="4" strokeLinecap="round" />
            <circle cx="94" cy="38" r="7" fill="#C5CBD0" />
            <path d="M90 46 L90 72 L118 76 L118 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Arms pressing upward */}
            <path d="M84 48 L74 22" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M98 48 L112 22" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="68" y="16" width="12" height="5" rx="1.5" fill="#00D2BE" />
            <rect x="106" y="16" width="12" height="5" rx="1.5" fill="#00D2BE" />
            <path d="M142 46 L142 22 M137 28 L142 21 L147 28" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'lateral_raise':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <circle cx="100" cy="24" r="7" fill="#C5CBD0" />
            <path d="M100 32 L100 66 L90 96 M100 66 L110 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Arms out to sides */}
            <path d="M100 38 L52 40" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M100 38 L148 40" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="44" y="37" width="10" height="6" rx="1.5" fill="#00D2BE" />
            <rect x="146" y="37" width="10" height="6" rx="1.5" fill="#00D2BE" />
            {/* Arcs */}
            <path d="M64 68 Q48 56 50 45" fill="none" stroke="#00D2BE" strokeWidth="1.8" strokeDasharray="3 3" />
            <path d="M136 68 Q152 56 150 45" fill="none" stroke="#00D2BE" strokeWidth="1.8" strokeDasharray="3 3" />
          </>
        );

      case 'face_pull':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <rect x="34" y="18" width="10" height="80" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            <line x1="44" y1="36" x2="104" y2="32" stroke="#00D2BE" strokeWidth="2" />
            <circle cx="118" cy="26" r="7" fill="#C5CBD0" />
            <path d="M118 34 L120 66 L110 96 M120 66 L132 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M118 40 L98 32" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M84 22 L106 22 M100 17 L107 22 L100 27" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'incline_bench':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Incline bench */}
            <path d="M46 46 L86 78 L112 78" fill="none" stroke="#707982" strokeWidth="5" strokeLinecap="round" />
            <line x1="60" y1="60" x2="60" y2="98" stroke="#707982" strokeWidth="2" />
            <line x1="106" y1="78" x2="106" y2="98" stroke="#707982" strokeWidth="2" />
            <circle cx="56" cy="36" r="7" fill="#C5CBD0" />
            <path d="M62 42 L88 72 L120 74 L126 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Pressing dumbbells */}
            <path d="M74 52 L82 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <rect x="75" y="18" width="14" height="6" rx="1.5" fill="#00D2BE" />
            <path d="M98 46 L98 22 M93 28 L98 21 L103 28" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'triceps_rope':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <rect x="44" y="16" width="10" height="82" fill="#1F262E" stroke="#707982" strokeWidth="1.5" />
            <line x1="54" y1="22" x2="86" y2="54" stroke="#00D2BE" strokeWidth="2" />
            <circle cx="114" cy="26" r="7" fill="#C5CBD0" />
            <path d="M114 34 L112 66 L104 96 M112 66 L122 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Upper arm fixed, forearm extending down */}
            <path d="M110 40 L102 56 L84 62" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M72 48 L72 68 M67 62 L72 69 L77 62" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'biceps_curl':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <circle cx="100" cy="24" r="7" fill="#C5CBD0" />
            <path d="M100 32 L100 66 L92 96 M100 66 L108 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M100 38 L104 58 L122 44" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="118" y="38" width="10" height="6" rx="1.5" fill="#00D2BE" />
            <path d="M132 64 Q138 52 130 42" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'plank':
        return (
          <>
            <line x1="12" y1="92" x2="188" y2="92" stroke="#707982" strokeWidth="1.5" />
            {/* Straight plank line */}
            <circle cx="48" cy="64" r="7" fill="#C5CBD0" />
            <path d="M56 68 L104 68 L158 76 L160 90" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Forearms on floor */}
            <path d="M62 70 L62 88 L46 88" fill="none" stroke="#C5CBD0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Core engagement highlight */}
            <ellipse cx="100" cy="68" rx="18" ry="5" fill="#00D2BE" fillOpacity="0.35" stroke="#00D2BE" strokeWidth="1.5" />
          </>
        );

      case 'hiit_cardio':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            {/* Sprint runner leaning forward */}
            <circle cx="112" cy="24" r="7" fill="#C5CBD0" />
            <path d="M108 32 L92 58" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M92 58 L120 68 L112 94" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M92 58 L64 74 L52 88" fill="none" stroke="#C5CBD0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Speed telemetry lines */}
            <line x1="28" y1="34" x2="72" y2="34" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="48" x2="62" y2="48" stroke="#00D2BE" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round" />
          </>
        );

      case 'kettlebell_swing':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <circle cx="96" cy="24" r="7" fill="#C5CBD0" />
            <path d="M96 32 L92 62 L84 96 M92 62 L104 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Extended arms holding kettlebell */}
            <path d="M96 38 L138 42" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="144" cy="44" r="6" fill="#00D2BE" />
            <path d="M116 80 Q146 70 146 54" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'walking_lunge':
        return (
          <>
            <line x1="12" y1="98" x2="188" y2="98" stroke="#707982" strokeWidth="1.5" />
            <circle cx="102" cy="26" r="7" fill="#C5CBD0" />
            <path d="M100 34 L98 62 L130 68 L130 96" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M98 62 L76 84 L58 84" fill="none" stroke="#C5CBD0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M134 38 L162 38 M156 33 L163 38 L156 43" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'leg_raise_abs':
        return (
          <>
            <line x1="12" y1="96" x2="188" y2="96" stroke="#707982" strokeWidth="1.5" />
            {/* Supine torso */}
            <circle cx="48" cy="82" r="7" fill="#C5CBD0" />
            <path d="M56 84 L104 84" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            {/* Legs raising */}
            <path d="M104 84 L152 84" fill="none" stroke="#707982" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
            <path d="M104 84 L112 34" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M142 74 Q142 46 120 38" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'hip_90_90':
        return (
          <>
            <line x1="12" y1="94" x2="188" y2="94" stroke="#707982" strokeWidth="1.5" />
            <circle cx="96" cy="36" r="7" fill="#C5CBD0" />
            <path d="M96 44 L96 76" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            {/* 90/90 legs */}
            <path d="M96 76 L62 80 L54 92" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M96 76 L132 76 L142 92" fill="none" stroke="#00D2BE" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M74 62 Q98 54 124 62" fill="none" stroke="#00D2BE" strokeWidth="1.8" strokeDasharray="3 3" />
          </>
        );

      case 'thoracic_rotation':
        return (
          <>
            <line x1="12" y1="94" x2="188" y2="94" stroke="#707982" strokeWidth="1.5" />
            {/* 4-point stance */}
            <circle cx="62" cy="48" r="7" fill="#C5CBD0" />
            <path d="M70 52 L116 56 L120 92" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M74 54 L72 92" fill="none" stroke="#C5CBD0" strokeWidth="3.5" strokeLinecap="round" />
            {/* Rotating arm open upward */}
            <path d="M74 52 L88 24" fill="none" stroke="#00D2BE" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M62 28 Q76 18 92 22" fill="none" stroke="#00D2BE" strokeWidth="2" strokeLinecap="round" />
          </>
        );

      case 'dead_bug':
        return (
          <>
            <line x1="12" y1="92" x2="188" y2="92" stroke="#707982" strokeWidth="1.5" />
            <circle cx="48" cy="80" r="7" fill="#C5CBD0" />
            <path d="M56 82 L110 82" fill="none" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
            {/* Opposite arm & leg extended */}
            <path d="M70 82 L68 48" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M70 82 L36 68" fill="none" stroke="#00D2BE" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M110 82 L110 52 L134 52" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M110 82 L156 76" fill="none" stroke="#00D2BE" strokeWidth="4" strokeLinecap="round" />
          </>
        );
    }
  };

  return (
    <div
      className={`relative rounded bg-[#080B0E] border border-[#707982]/30 overflow-hidden select-none ${className}`}
    >
      <svg
        viewBox="0 0 200 110"
        className="w-full h-full block"
        role="img"
        aria-label={title ? `Demonstração visual de ${title}` : 'Demonstração do exercício'}
      >
        {/* Subtle technical grid */}
        <defs>
          <pattern id={`grid-${illustrationKey}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(197, 203, 208, 0.06)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="200" height="110" fill={`url(#grid-${illustrationKey})`} />
        {renderDiagram()}
      </svg>
    </div>
  );
}

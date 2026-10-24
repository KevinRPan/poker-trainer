import type { MoveGrade, StepAttemptRecord } from '../types/poker';

export interface GradeMeta {
  grade: MoveGrade;
  label: string;
  symbol: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeBg: string;
  description: string;
  scoreWeight: number; // 0 to 100
}

export const GRADE_META: Record<MoveGrade, GradeMeta> = {
  brilliant: {
    grade: 'brilliant',
    label: 'Brilliant',
    symbol: '!!',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-400/50',
    badgeBg: 'bg-cyan-500 text-slate-950',
    description: 'High-level, non-obvious GTO exploit or fearless range play!',
    scoreWeight: 100,
  },
  best: {
    grade: 'best',
    label: 'Best Move',
    symbol: '★',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-500 text-slate-950',
    description: 'The highest-EV solver-approved line.',
    scoreWeight: 100,
  },
  good: {
    grade: 'good',
    label: 'Good Move',
    symbol: '✓',
    color: 'text-lime-400',
    bgColor: 'bg-lime-500/15',
    borderColor: 'border-lime-500/40',
    badgeBg: 'bg-lime-500 text-slate-950',
    description: 'Solid mixed-frequency play with minimal EV loss.',
    scoreWeight: 85,
  },
  inaccuracy: {
    grade: 'inaccuracy',
    label: 'Inaccuracy',
    symbol: '?!',
    color: 'text-amber-300',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-400/50',
    badgeBg: 'bg-amber-400 text-slate-950',
    description: 'Suboptimal sizing or slightly leaky frequency.',
    scoreWeight: 60,
  },
  mistake: {
    grade: 'mistake',
    label: 'Mistake',
    symbol: '?',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/50',
    badgeBg: 'bg-orange-500 text-slate-950',
    description: 'Significant EV loss that hurts your winrate in this spot.',
    scoreWeight: 30,
  },
  blunder: {
    grade: 'blunder',
    label: 'Blunder',
    symbol: '??',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/50',
    badgeBg: 'bg-rose-500 text-white',
    description: 'Catastrophic EV torch or punt against Villain’s range.',
    scoreWeight: 5,
  },
};

export function calculateHandAccuracy(steps: StepAttemptRecord[]): {
  accuracyScore: number;
  overallGrade: MoveGrade;
  totalEvLostBB: number;
} {
  if (steps.length === 0) {
    return { accuracyScore: 100, overallGrade: 'best', totalEvLostBB: 0 };
  }

  const totalScore = steps.reduce((acc, step) => {
    const baseWeight = GRADE_META[step.grade].scoreWeight;
    const evPenalty = Math.min(25, step.evLostBB * 2.5);
    return acc + Math.max(0, baseWeight - (step.grade === 'best' || step.grade === 'brilliant' ? 0 : evPenalty));
  }, 0);

  const accuracyScore = Math.round(totalScore / steps.length);
  const totalEvLostBB = Number(
    steps.reduce((acc, s) => acc + s.evLostBB, 0).toFixed(2)
  );

  const hasBrilliant = steps.some((s) => s.grade === 'brilliant');
  const hasBlunder = steps.some((s) => s.grade === 'blunder');
  const hasMistake = steps.some((s) => s.grade === 'mistake');

  let overallGrade: MoveGrade = 'best';
  if (hasBrilliant && accuracyScore >= 92) {
    overallGrade = 'brilliant';
  } else if (accuracyScore >= 93) {
    overallGrade = 'best';
  } else if (accuracyScore >= 78 && !hasBlunder) {
    overallGrade = 'good';
  } else if (accuracyScore >= 58 && !hasBlunder) {
    overallGrade = 'inaccuracy';
  } else if (hasMistake || accuracyScore >= 35) {
    overallGrade = 'mistake';
  } else {
    overallGrade = 'blunder';
  }

  return { accuracyScore, overallGrade, totalEvLostBB };
}

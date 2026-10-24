import type { MoveGrade, PositionName, PuzzleAttemptHistory, SetupTheme, TableFormat } from '../types/poker';

const STORAGE_KEY = 'poker_puzzle_trainer_history_v1';

export function loadAttemptHistory(): PuzzleAttemptHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAttemptRecord(record: PuzzleAttemptHistory): PuzzleAttemptHistory[] {
  const existing = loadAttemptHistory();
  const updated = [record, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save puzzle attempt history', e);
  }
  return updated;
}

export function clearAttemptHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export interface CategoryBreakdown {
  key: string;
  label: string;
  attempts: number;
  avgAccuracy: number;
  evLostPerHand: number;
  brilliantCount: number;
  blunderCount: number;
}

export interface UserStatsSummary {
  totalHandsPlayed: number;
  uniquePuzzlesSolved: string[];
  overallAccuracy: number;
  estimatedRating: number;
  totalEvLostBB: number;
  gradeCounts: Record<MoveGrade, number>;
  byTheme: CategoryBreakdown[];
  byFormat: CategoryBreakdown[];
  byPosition: CategoryBreakdown[];
  strengths: CategoryBreakdown[];
  weaknesses: CategoryBreakdown[];
}

const FORMAT_LABELS: Record<TableFormat, string> = {
  'cash-6max': '6-Max Cash (100bb)',
  'cash-9max': '9-Max Full Ring',
  'mtt': 'MTT / ICM Spots',
  'heads-up': 'Heads-Up (1v1)',
};

export function computeUserStats(history: PuzzleAttemptHistory[]): UserStatsSummary {
  const gradeCounts: Record<MoveGrade, number> = {
    brilliant: 0,
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  if (history.length === 0) {
    return {
      totalHandsPlayed: 0,
      uniquePuzzlesSolved: [],
      overallAccuracy: 0,
      estimatedRating: 1200,
      totalEvLostBB: 0,
      gradeCounts,
      byTheme: [],
      byFormat: [],
      byPosition: [],
      strengths: [],
      weaknesses: [],
    };
  }

  let totalAccuracy = 0;
  let totalEvLostBB = 0;
  const uniqueSet = new Set<string>();

  const themeMap = new Map<SetupTheme, { acc: number; evLost: number; count: number; bril: number; blun: number }>();
  const formatMap = new Map<TableFormat, { acc: number; evLost: number; count: number; bril: number; blun: number }>();
  const posMap = new Map<PositionName, { acc: number; evLost: number; count: number; bril: number; blun: number }>();

  for (const item of history) {
    totalAccuracy += item.accuracyScore;
    uniqueSet.add(item.puzzleId);

    let handEvLost = 0;
    let handBril = 0;
    let handBlun = 0;

    for (const step of item.stepResults) {
      gradeCounts[step.grade] = (gradeCounts[step.grade] || 0) + 1;
      handEvLost += step.evLostBB;
      if (step.grade === 'brilliant') handBril++;
      if (step.grade === 'blunder') handBlun++;
    }
    totalEvLostBB += handEvLost;

    // By format
    const fStat = formatMap.get(item.format) || { acc: 0, evLost: 0, count: 0, bril: 0, blun: 0 };
    fStat.acc += item.accuracyScore;
    fStat.evLost += handEvLost;
    fStat.count += 1;
    fStat.bril += handBril;
    fStat.blun += handBlun;
    formatMap.set(item.format, fStat);

    // By position
    const pStat = posMap.get(item.heroPosition) || { acc: 0, evLost: 0, count: 0, bril: 0, blun: 0 };
    pStat.acc += item.accuracyScore;
    pStat.evLost += handEvLost;
    pStat.count += 1;
    pStat.bril += handBril;
    pStat.blun += handBlun;
    posMap.set(item.heroPosition, pStat);

    // By theme
    for (const theme of item.themes) {
      const tStat = themeMap.get(theme) || { acc: 0, evLost: 0, count: 0, bril: 0, blun: 0 };
      tStat.acc += item.accuracyScore;
      tStat.evLost += handEvLost;
      tStat.count += 1;
      tStat.bril += handBril;
      tStat.blun += handBlun;
      themeMap.set(theme, tStat);
    }
  }

  const overallAccuracy = Math.round(totalAccuracy / history.length);
  const ratingDelta = history.reduce((acc, h) => {
    if (h.accuracyScore >= 90) return acc + 22;
    if (h.accuracyScore >= 75) return acc + 10;
    if (h.accuracyScore >= 55) return acc - 5;
    return acc - 18;
  }, 1200);

  const byTheme: CategoryBreakdown[] = Array.from(themeMap.entries()).map(([key, v]) => ({
    key,
    label: key,
    attempts: v.count,
    avgAccuracy: Math.round(v.acc / v.count),
    evLostPerHand: Number((v.evLost / v.count).toFixed(2)),
    brilliantCount: v.bril,
    blunderCount: v.blun,
  })).sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  const byFormat: CategoryBreakdown[] = Array.from(formatMap.entries()).map(([key, v]) => ({
    key,
    label: FORMAT_LABELS[key] || key,
    attempts: v.count,
    avgAccuracy: Math.round(v.acc / v.count),
    evLostPerHand: Number((v.evLost / v.count).toFixed(2)),
    brilliantCount: v.bril,
    blunderCount: v.blun,
  })).sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  const byPosition: CategoryBreakdown[] = Array.from(posMap.entries()).map(([key, v]) => ({
    key,
    label: key,
    attempts: v.count,
    avgAccuracy: Math.round(v.acc / v.count),
    evLostPerHand: Number((v.evLost / v.count).toFixed(2)),
    brilliantCount: v.bril,
    blunderCount: v.blun,
  })).sort((a, b) => b.avgAccuracy - a.avgAccuracy);

  const allCategories = [...byTheme, ...byFormat];
  const strengths = allCategories.filter((c) => c.avgAccuracy >= 75).slice(0, 3);
  const weaknesses = [...allCategories]
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
    .filter((c) => c.avgAccuracy < 85)
    .slice(0, 3);

  return {
    totalHandsPlayed: history.length,
    uniquePuzzlesSolved: Array.from(uniqueSet),
    overallAccuracy,
    estimatedRating: Math.max(800, ratingDelta),
    totalEvLostBB: Number(totalEvLostBB.toFixed(2)),
    gradeCounts,
    byTheme,
    byFormat,
    byPosition,
    strengths,
    weaknesses,
  };
}

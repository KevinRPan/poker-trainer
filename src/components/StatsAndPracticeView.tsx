import React, { useState, useMemo } from 'react';
import type {
  PokerPuzzle,
  PuzzleAttemptHistory,
  TableFormat,
  SetupTheme,
  MoveGrade,
} from '../types/poker';
import { GRADE_META } from '../utils/grades';
import { computeUserStats, type CategoryBreakdown } from '../utils/storage';
import {
  Trophy,
  Target,
  Layers,
  TrendingDown,
  Zap,
  Filter,
  Play,
  RotateCcw,
  AlertTriangle,
  Search,
  Award,
  Trash2,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export interface StatsAndPracticeViewProps {
  puzzles: PokerPuzzle[];
  history: PuzzleAttemptHistory[];
  activeTab: 'practice' | 'stats';
  onSelectPuzzle: (puzzle: PokerPuzzle) => void;
  onStartFilteredQueue: (filteredPuzzles: PokerPuzzle[], label: string) => void;
  onClearHistory: () => void;
}

const TABLE_FORMAT_OPTIONS: { id: 'all' | TableFormat; label: string }[] = [
  { id: 'all', label: 'All Formats' },
  { id: 'cash-6max', label: '6-Max Cash' },
  { id: 'cash-9max', label: '9-Max Cash' },
  { id: 'mtt', label: 'MTT / ICM' },
  { id: 'heads-up', label: 'Heads-Up' },
];

const SETUP_THEMES: { id: 'all' | SetupTheme; label: string }[] = [
  { id: 'all', label: 'All Themes' },
  { id: 'Preflop Ranges', label: 'Preflop Ranges' },
  { id: '3-Bet Pots', label: '3-Bet Pots' },
  { id: 'River Bluff Catch', label: 'River Bluff Catch' },
  { id: 'ICM & Tournament', label: 'ICM & Tournament' },
  { id: 'C-Bet & Barrel', label: 'C-Bet & Barrel' },
  { id: 'Check-Raise Spots', label: 'Check-Raise Spots' },
  { id: 'Heads-Up Battles', label: 'Heads-Up Battles' },
  { id: 'Overbet Pressure', label: 'Overbet Pressure' },
];

const DIFFICULTY_OPTIONS: ('all' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Master')[] = [
  'all',
  'Beginner',
  'Intermediate',
  'Advanced',
  'Master',
];

const ORDERED_GRADES: MoveGrade[] = [
  'brilliant',
  'best',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
];

export const StatsAndPracticeView: React.FC<StatsAndPracticeViewProps> = ({
  puzzles,
  history,
  activeTab,
  onSelectPuzzle,
  onStartFilteredQueue,
  onClearHistory,
}) => {
  // Practice filters state
  const [selectedFormat, setSelectedFormat] = useState<'all' | TableFormat>('all');
  const [selectedTheme, setSelectedTheme] = useState<'all' | SetupTheme>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    'all' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Master'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats Breakdown sub-tab
  const [breakdownCategory, setBreakdownCategory] = useState<'theme' | 'format' | 'position'>(
    'theme'
  );

  // Clear history confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute stats using storage utility
  const stats = useMemo(() => computeUserStats(history), [history]);

  const preflopPuzzles = useMemo(
    () => puzzles.filter((p) => p.themes.includes('Preflop Ranges')),
    [puzzles]
  );

  // Compute best attempt map per puzzle for instant lookup
  const bestAttemptByPuzzleId = useMemo(() => {
    const map = new Map<string, { accuracy: number; grade: MoveGrade; count: number }>();
    for (const h of history) {
      const existing = map.get(h.puzzleId);
      if (!existing || h.accuracyScore > existing.accuracy) {
        map.set(h.puzzleId, {
          accuracy: h.accuracyScore,
          grade: h.overallGrade,
          count: (existing?.count || 0) + 1,
        });
      } else {
        existing.count += 1;
      }
    }
    return map;
  }, [history]);

  // Filtered puzzles for Practice view
  const filteredPuzzles = useMemo(() => {
    return puzzles.filter((p) => {
      if (selectedFormat !== 'all' && p.format !== selectedFormat) return false;
      if (selectedTheme !== 'all' && !p.themes.includes(selectedTheme)) return false;
      if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSubtitle = p.subtitle.toLowerCase().includes(q);
        const matchesTheme = p.themes.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSubtitle && !matchesTheme) return false;
      }
      return true;
    });
  }, [puzzles, selectedFormat, selectedTheme, selectedDifficulty, searchQuery]);

  // Total moves in lifetime history for percentages
  const totalMoves = useMemo(() => {
    return Object.values(stats.gradeCounts).reduce((acc, count) => acc + count, 0);
  }, [stats.gradeCounts]);

  // Handle drill start from filter
  const handleStartDrill = () => {
    if (filteredPuzzles.length === 0) return;
    const formatLabel =
      selectedFormat === 'all'
        ? ''
        : TABLE_FORMAT_OPTIONS.find((f) => f.id === selectedFormat)?.label || '';
    const themeLabel = selectedTheme === 'all' ? '' : selectedTheme;
    const drillLabel = [themeLabel, formatLabel].filter(Boolean).join(' • ') || 'Custom Drill';
    onStartFilteredQueue(filteredPuzzles, drillLabel);
  };

  // Helper for starting drill on specific leak
  const handlePracticeWeakness = (weakness: CategoryBreakdown) => {
    const matching = puzzles.filter(
      (p) => p.format === weakness.key || p.themes.includes(weakness.key as SetupTheme)
    );
    const queue = matching.length > 0 ? matching : puzzles;
    onStartFilteredQueue(queue, `Fix Leak: ${weakness.label}`);
  };

  // Get difficulty badge color
  const getDifficultyColor = (diff: PokerPuzzle['difficulty']) => {
    switch (diff) {
      case 'Beginner':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Intermediate':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'Advanced':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Master':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Get GTO rating tier title
  const getRatingTier = (rating: number) => {
    if (rating >= 2200) return 'GTO Wizard 🧙‍♂️';
    if (rating >= 1900) return 'High Stakes Crusher 🚀';
    if (rating >= 1600) return 'Solid Reg 🔥';
    if (rating >= 1300) return 'Rising Grinder 📈';
    return 'Apprentice 📚';
  };

  return (
    <div className="w-full max-w-md lg:max-w-4xl mx-auto text-slate-100 pb-20 lg:pb-6">
      {/* ======================================================== */}
      {/* VIEW 1: PRACTICE / SETUPS TAB                            */}
      {/* ======================================================== */}
      {activeTab === 'practice' && (
        <div className="space-y-4">
          {/* Preflop Hands Trainer — fold / open / 3-bet drills */}
          {preflopPuzzles.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/35 p-4 shadow-lg">
              <div className="flex items-start gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0 mt-0.5">
                  <Layers className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Hands Trainer
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1">Preflop Fold & Raise Drills</h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Open, fold, defend, 3-bet, and squeeze — single-street decisions before the flop.
                  </p>
                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onStartFilteredQueue(preflopPuzzles, 'Preflop Hands Trainer')
                      }
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Start Preflop Trainer ({preflopPuzzles.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTheme('Preflop Ranges');
                        setSelectedFormat('all');
                        setSelectedDifficulty('all');
                        setSearchQuery('');
                      }}
                      className="sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-emerald-500/40 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Filter className="w-3.5 h-3.5 text-emerald-400" />
                      Filter list
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart "Train Weaknesses" Banner if leaks exist */}
          {stats.weaknesses.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-600/15 border border-amber-500/40 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 shrink-0 mt-0.5">
                    <ShieldAlert className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                        Smart Coach Leak Alert
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1">
                      Improve: {stats.weaknesses[0].label}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Your average accuracy in this spot is{' '}
                      <strong className="text-amber-300">
                        {stats.weaknesses[0].avgAccuracy}%
                      </strong>{' '}
                      (-{stats.weaknesses[0].evLostPerHand} BB/hand). Drill this setup to plug the leak!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePracticeWeakness(stats.weaknesses[0])}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 active:scale-98 font-bold text-xs text-slate-950 flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>Train Weakness Drill ({stats.weaknesses[0].label})</span>
                </button>
              </div>
            </div>
          )}

          {/* Search & Filter Header */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Practice Setups & Drills
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {filteredPuzzles.length} of {puzzles.length} Puzzles
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search spots, bluff catches, 3-bet pots..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Table Format Filter Pills */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Table Format:
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {TABLE_FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedFormat === fmt.id
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Setup Themes Horizontal Pills */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Setup Theme:
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SETUP_THEMES.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setSelectedTheme(th.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedTheme === th.id
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Difficulty:
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {DIFFICULTY_OPTIONS.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {diff === 'all' ? 'All Difficulties' : diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Filtered Drill Button */}
            {filteredPuzzles.length > 0 && (
              <button
                type="button"
                onClick={handleStartDrill}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Start Filtered Drill ({filteredPuzzles.length} Hands)</span>
              </button>
            )}
          </div>

          {/* Puzzle Cards List */}
          <div className="space-y-2.5">
            {filteredPuzzles.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800/80">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300">No puzzles match your filters</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Try clearing the search query or resetting format and theme filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFormat('all');
                    setSelectedTheme('all');
                    setSelectedDifficulty('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredPuzzles.map((puzzle) => {
                const userAttempt = bestAttemptByPuzzleId.get(puzzle.id);
                const hasSolved = !!userAttempt;
                const gradeMeta = userAttempt ? GRADE_META[userAttempt.grade] : null;

                return (
                  <div
                    key={puzzle.id}
                    onClick={() => onSelectPuzzle(puzzle)}
                    className="p-3.5 bg-slate-900/90 hover:bg-slate-850 active:scale-99 border border-slate-800/80 hover:border-slate-700 rounded-2xl transition-all cursor-pointer shadow-md relative overflow-hidden group"
                  >
                    {/* Top Row: Format & Difficulty & Rating */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {puzzle.format.toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(
                            puzzle.difficulty
                          )}`}
                        >
                          {puzzle.difficulty}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Hero: <strong className="text-emerald-400">{puzzle.heroPosition}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-400">
                        <Trophy className="w-3 h-3" />
                        <span>{puzzle.rating}</span>
                      </div>
                    </div>

                    {/* Middle: Title & Subtitle */}
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                      {puzzle.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{puzzle.subtitle}</p>

                    {/* Bottom Row: Theme Tags & User Solved Badge */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {puzzle.themes.map((theme) => (
                          <span
                            key={theme}
                            className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 whitespace-nowrap"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>

                      {hasSolved && gradeMeta ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded ${gradeMeta.badgeBg}`}
                          >
                            <span>{gradeMeta.symbol}</span>
                            <span>{userAttempt.accuracy}%</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-950/50 px-2 py-0.5 rounded shrink-0">
                          Unplayed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: STATS & WEAKNESSES TAB                           */}
      {/* ======================================================== */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl">
              <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Hand History Yet</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                Play multi-street poker puzzles to unlock your GTO Rating, leak diagnostics, and
                custom accuracy reports!
              </p>
              <button
                type="button"
                onClick={() => onSelectPuzzle(puzzles[0])}
                className="mt-4 py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold text-xs text-slate-950 inline-flex items-center gap-2 shadow-lg"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Play Your First Hand</span>
              </button>
            </div>
          ) : (
            <>
              {/* Top-Level KPI Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. GTO Rating */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>GTO Rating</span>
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 tracking-tight">
                    {stats.estimatedRating}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                    {getRatingTier(stats.estimatedRating)}
                  </div>
                </div>

                {/* 2. Avg Accuracy % */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Avg Accuracy</span>
                    <Target className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400 tracking-tight">
                    {stats.overallAccuracy}
                    <span className="text-sm font-semibold text-slate-400">%</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                    {stats.overallAccuracy >= 85
                      ? 'Crushing GTO'
                      : stats.overallAccuracy >= 70
                      ? 'Solid mixed play'
                      : 'Leaky lines'}
                  </div>
                </div>

                {/* 3. Hands Played */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Hands Played</span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black text-white tracking-tight">
                    {stats.totalHandsPlayed}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                    {stats.uniquePuzzlesSolved.length} Unique Solved
                  </div>
                </div>

                {/* 4. Total EV Lost */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-3.5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
                    <span>Total EV Lost</span>
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-black text-rose-400 tracking-tight">
                    -{stats.totalEvLostBB.toFixed(1)}
                    <span className="text-xs font-semibold text-slate-400 ml-1">BB</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                    Across {totalMoves} Decisions
                  </div>
                </div>
              </div>

              {/* Lifetime Move Classification Distribution (Chess.com Style) */}
              <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Lifetime Move Classification</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {totalMoves} Total Moves
                  </span>
                </div>

                <div className="space-y-2">
                  {ORDERED_GRADES.map((grade) => {
                    const meta = GRADE_META[grade];
                    const count = stats.gradeCounts[grade] || 0;
                    const pct = totalMoves > 0 ? Math.round((count / totalMoves) * 100) : 0;

                    return (
                      <div key={grade} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`flex items-center justify-center w-5 h-5 rounded text-[11px] font-black ${meta.badgeBg}`}
                            >
                              {meta.symbol}
                            </span>
                            <span className="font-bold text-slate-200">{meta.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">{count}</span>
                            <span className="text-[11px] text-slate-400 w-8 text-right">{pct}%</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              grade === 'brilliant'
                                ? 'bg-cyan-400'
                                : grade === 'best'
                                ? 'bg-emerald-400'
                                : grade === 'good'
                                ? 'bg-lime-400'
                                : grade === 'inaccuracy'
                                ? 'bg-amber-400'
                                : grade === 'mistake'
                                ? 'bg-orange-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Your Strengths Section (Green) */}
              <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Your Strengths (High Accuracy Spots)</span>
                </div>

                {stats.strengths.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-950/50 rounded-xl">
                    Play more hands across different themes to discover your top poker strengths.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {stats.strengths.map((str) => (
                      <div
                        key={str.key}
                        className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-white">{str.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {str.attempts} {str.attempts === 1 ? 'hand' : 'hands'} played •{' '}
                            {str.evLostPerHand === 0
                              ? 'Zero EV lost'
                              : `-${str.evLostPerHand} BB/hand`}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                            {str.avgAccuracy}% Accuracy
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Leak Finder / Areas to Improve Section (Amber / Rose) */}
              <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Leak Finder / Areas to Improve</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">Priority Fixes</span>
                </div>

                {stats.weaknesses.length === 0 ? (
                  <p className="text-xs text-emerald-400 italic p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    No major leaks found yet! You are playing within GTO solver frequencies.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {stats.weaknesses.map((leak) => (
                      <div
                        key={leak.key}
                        className="p-3.5 rounded-xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-slate-900/60 border border-rose-500/30 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{leak.label}</span>
                              {leak.blunderCount > 0 && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-rose-500 text-white">
                                  {leak.blunderCount} ??
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              Avg Accuracy: <strong className="text-rose-400">{leak.avgAccuracy}%</strong>{' '}
                              • EV Loss: <strong className="text-rose-400">-{leak.evLostPerHand} BB/hand</strong>
                            </div>
                          </div>

                          <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 shrink-0">
                            Leak
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePracticeWeakness(leak)}
                          className="w-full py-2 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 active:scale-98 border border-rose-500/40 text-xs font-bold text-rose-200 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Practice This Setup</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Categorical Breakdown Bars: Theme, Format, Position */}
              <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Category Deep Dive
                  </div>

                  {/* Sub-tabs for Category */}
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setBreakdownCategory('theme')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        breakdownCategory === 'theme'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Theme
                    </button>
                    <button
                      type="button"
                      onClick={() => setBreakdownCategory('format')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        breakdownCategory === 'format'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Format
                    </button>
                    <button
                      type="button"
                      onClick={() => setBreakdownCategory('position')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        breakdownCategory === 'position'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Position
                    </button>
                  </div>
                </div>

                {/* Selected Category Breakdown List */}
                <div className="space-y-2.5">
                  {(breakdownCategory === 'theme'
                    ? stats.byTheme
                    : breakdownCategory === 'format'
                    ? stats.byFormat
                    : stats.byPosition
                  ).map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 truncate pr-2">{item.label}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{item.attempts} hands</span>
                          <span
                            className={`font-black ${
                              item.avgAccuracy >= 80
                                ? 'text-emerald-400'
                                : item.avgAccuracy >= 65
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {item.avgAccuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800/60">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.avgAccuracy >= 80
                              ? 'bg-emerald-400'
                              : item.avgAccuracy >= 65
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.avgAccuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Recent Hand History Log */}
              <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Recent Hand History</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Last {Math.min(10, history.length)} Hands
                  </span>
                </div>

                <div className="space-y-2">
                  {history.slice(0, 10).map((item) => {
                    const gradeMeta = GRADE_META[item.overallGrade] ?? GRADE_META.best;
                    const dateStr = new Date(item.timestamp).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white truncate">{item.puzzleTitle}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span className="uppercase">{item.format}</span>
                            <span>•</span>
                            <span>{item.heroPosition}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded ${gradeMeta.badgeBg}`}
                          >
                            <span>{gradeMeta.symbol}</span>
                            <span>{item.accuracyScore}%</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Clear History Danger Zone */}
              <div className="pt-2">
                {showClearConfirm ? (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                    <p className="text-xs text-rose-300 font-semibold">
                      Are you sure you want to clear all hand attempt history? This cannot be undone.
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClearHistory();
                          setShowClearConfirm(false);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-rose-500 text-white text-xs font-black hover:bg-rose-600"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Practice History</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StatsAndPracticeView;

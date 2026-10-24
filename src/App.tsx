import { useState, useMemo } from 'react';
import {
  Spade,
  Trophy,
  BarChart3,
  Layers,
  ChevronRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Flame,
  Eye,
} from 'lucide-react';
import { POKER_PUZZLES } from './data/puzzles';
import type {
  ActionChoice,
  PokerPuzzle,
  PuzzleAttemptHistory,
  StepAttemptRecord,
} from './types/poker';
import { GRADE_META, calculateHandAccuracy } from './utils/grades';
import {
  clearAttemptHistory,
  computeUserStats,
  loadAttemptHistory,
  saveAttemptRecord,
} from './utils/storage';
import { PokerTableMobile } from './components/PokerTableMobile';
import { HandReviewPanel } from './components/HandReviewPanel';
import { StatsAndPracticeView } from './components/StatsAndPracticeView';

type NavTab = 'play' | 'practice' | 'stats';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('play');
  const [history, setHistory] = useState<PuzzleAttemptHistory[]>(() =>
    loadAttemptHistory()
  );

  // Active puzzle queue & index
  const [puzzleQueue, setPuzzleQueue] = useState<PokerPuzzle[]>(POKER_PUZZLES);
  const [queueLabel, setQueueLabel] = useState<string>('All Curated Spots');
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState<number>(0);

  // Hand play state
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<ActionChoice | null>(null);
  const [stepRecords, setStepRecords] = useState<StepAttemptRecord[]>([]);
  const [isHandComplete, setIsHandComplete] = useState<boolean>(false);
  const [showTableInReview, setShowTableInReview] = useState<boolean>(false);

  const currentPuzzle = puzzleQueue[currentPuzzleIdx] || POKER_PUZZLES[0];
  const currentStep = currentPuzzle.steps[stepIdx] || currentPuzzle.steps[0];

  const stats = useMemo(() => computeUserStats(history), [history]);

  const startPuzzle = (puzzle: PokerPuzzle, customQueue?: PokerPuzzle[], label?: string) => {
    if (customQueue && customQueue.length > 0) {
      setPuzzleQueue(customQueue);
      const foundIdx = customQueue.findIndex((p) => p.id === puzzle.id);
      setCurrentPuzzleIdx(foundIdx >= 0 ? foundIdx : 0);
      if (label) setQueueLabel(label);
    } else {
      const idxInCurrent = puzzleQueue.findIndex((p) => p.id === puzzle.id);
      if (idxInCurrent >= 0) {
        setCurrentPuzzleIdx(idxInCurrent);
      } else {
        setPuzzleQueue(POKER_PUZZLES);
        setQueueLabel('All Curated Spots');
        const defaultIdx = POKER_PUZZLES.findIndex((p) => p.id === puzzle.id);
        setCurrentPuzzleIdx(defaultIdx >= 0 ? defaultIdx : 0);
      }
    }
    setStepIdx(0);
    setSelectedChoice(null);
    setStepRecords([]);
    setIsHandComplete(false);
    setShowTableInReview(false);
    setActiveTab('play');
  };

  const handleChooseAction = (choice: ActionChoice) => {
    if (selectedChoice) return; // already answered this street

    setSelectedChoice(choice);

    // Find highest EV choice on this step
    const bestChoice = currentStep.choices.reduce((best, c) =>
      c.evBB > best.evBB ? c : best
    , currentStep.choices[0]);

    const evLostBB = Number(Math.max(0, bestChoice.evBB - choice.evBB).toFixed(2));

    const newRecord: StepAttemptRecord = {
      stepIndex: currentStep.stepIndex,
      street: currentStep.street,
      chosenActionId: choice.id,
      chosenActionLabel: choice.label,
      bestActionId: bestChoice.id,
      bestActionLabel: bestChoice.label,
      grade: choice.grade,
      evLostBB,
      evChosenBB: choice.evBB,
      evBestBB: bestChoice.evBB,
    };

    setStepRecords((prev) => [...prev, newRecord]);
  };

  const handleAdvanceStreetOrFinish = () => {
    if (stepIdx + 1 < currentPuzzle.steps.length) {
      setStepIdx((prev) => prev + 1);
      setSelectedChoice(null);
    } else {
      // Complete hand & persist to localStorage
      const { accuracyScore, overallGrade } = calculateHandAccuracy(stepRecords);
      const attempt: PuzzleAttemptHistory = {
        id: `${currentPuzzle.id}-${Date.now()}`,
        puzzleId: currentPuzzle.id,
        puzzleTitle: currentPuzzle.title,
        format: currentPuzzle.format,
        themes: currentPuzzle.themes,
        heroPosition: currentPuzzle.heroPosition,
        timestamp: Date.now(),
        accuracyScore,
        stepResults: stepRecords,
        overallGrade,
      };
      const updated = saveAttemptRecord(attempt);
      setHistory(updated);
      setIsHandComplete(true);
    }
  };

  const handleRetryHand = () => {
    setStepIdx(0);
    setSelectedChoice(null);
    setStepRecords([]);
    setIsHandComplete(false);
    setShowTableInReview(false);
  };

  const handleNextPuzzle = () => {
    const nextIdx = (currentPuzzleIdx + 1) % puzzleQueue.length;
    setCurrentPuzzleIdx(nextIdx);
    setStepIdx(0);
    setSelectedChoice(null);
    setStepRecords([]);
    setIsHandComplete(false);
    setShowTableInReview(false);
  };

  const handleStartFilteredQueue = (filtered: PokerPuzzle[], label: string) => {
    if (filtered.length === 0) return;
    startPuzzle(filtered[0], filtered, label);
  };

  const handleClearHistory = () => {
    clearAttemptHistory();
    setHistory([]);
  };

  // Best choice for current step (used when showing immediate street feedback)
  const currentBestChoice = useMemo(() => {
    return currentStep.choices.reduce(
      (best, c) => (c.evBB > best.evBB ? c : best),
      currentStep.choices[0]
    );
  }, [currentStep]);

  return (
    <div className="min-h-dvh lg:h-dvh bg-slate-950 text-slate-100 flex flex-col max-w-md lg:max-w-6xl mx-auto border-x border-slate-900/80 shadow-2xl relative lg:overflow-hidden">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 py-2 sm:py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-950/50 shrink-0">
            <Spade className="w-4 h-4 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">
                GTO Puzzle
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Trainer
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[170px] sm:max-w-[220px]">
              {activeTab === 'play' ? queueLabel : 'Chess.com-style Poker Drills'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Cleanly integrated in header for lg:) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('play')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'play'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Spade className="w-4 h-4" />
            <span>Play Puzzle</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'practice'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Practice Setups</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition relative ${
              activeTab === 'stats'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Stats & Leaks</span>
            {stats.weaknesses.length > 0 && (
              <span
                className="w-2 h-2 rounded-full bg-amber-400"
                title="Leaks detected to practice"
              />
            )}
          </button>
        </nav>

        {/* Header Right Stats: ELO & Puzzles Solved */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('stats')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition text-xs"
            title="Estimated GTO Rating"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-slate-100">{stats.estimatedRating}</span>
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition text-xs text-slate-300"
          >
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">
              {stats.uniquePuzzlesSolved.length}/{POKER_PUZZLES.length}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 min-h-0 ${
          activeTab === 'play'
            ? 'overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0'
            : 'overflow-y-auto pb-20 lg:pb-6'
        }`}
      >
        {activeTab === 'play' && (
          <>
            {/* Active Hand Play OR Replay Table View */}
            {!isHandComplete || showTableInReview ? (
              <>
                {/* Mobile Single-Column Vertical Layout (< lg) */}
                <div className="lg:hidden px-3 pt-2.5 pb-4 space-y-3">
                  {/* Puzzle Title & Street Progress Bar */}
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 shadow-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Puzzle #{currentPuzzleIdx + 1} of {puzzleQueue.length}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            ELO {currentPuzzle.rating} • {currentPuzzle.difficulty}
                          </span>
                        </div>
                        <h1 className="text-sm font-bold text-white mt-1">
                          {currentPuzzle.title}
                        </h1>
                        <p className="text-xs text-slate-400">{currentPuzzle.subtitle}</p>
                      </div>

                      <button
                        onClick={handleNextPuzzle}
                        className="shrink-0 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 transition flex items-center gap-0.5"
                      >
                        Skip
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Multi-Street Progress Steps */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1">
                        {currentPuzzle.steps.map((s, idx) => {
                          const completedRec = stepRecords[idx];
                          const isCurrent = idx === stepIdx && !isHandComplete;
                          const gradeMeta = completedRec
                            ? GRADE_META[completedRec.grade]
                            : null;

                          return (
                            <div
                              key={s.stepIndex}
                              className={`flex-1 h-7 rounded-lg px-2 flex items-center justify-between text-[11px] font-bold border transition ${
                                completedRec && gradeMeta
                                  ? `${gradeMeta.bgColor} ${gradeMeta.borderColor} ${gradeMeta.color}`
                                  : isCurrent
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                  : 'bg-slate-950/60 border-slate-800 text-slate-500'
                              }`}
                            >
                              <span className="uppercase">{s.street}</span>
                              {completedRec && gradeMeta ? (
                                <span
                                  className={`text-[10px] px-1 rounded font-black ${gradeMeta.badgeBg}`}
                                >
                                  {gradeMeta.symbol}
                                </span>
                              ) : isCurrent ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {isHandComplete && (
                        <button
                          onClick={() => setShowTableInReview((v) => !v)}
                          className="px-2.5 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          {showTableInReview ? 'Review' : 'Table'}
                        </button>
                      )}
                    </div>
                  </div>

                  <PokerTableMobile
                    puzzle={currentPuzzle}
                    currentStep={currentStep}
                    revealVillainCards={isHandComplete}
                    lastChosenChoice={selectedChoice}
                  />

                  {/* Situation Prompt Banner */}
                  <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Decision Point • {currentStep.street.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Pot: <strong className="text-slate-200">{currentStep.potBB} BB</strong>
                        {currentStep.toCallBB > 0 && (
                          <>
                            {' '}
                            • To Call:{' '}
                            <strong className="text-amber-300">
                              {currentStep.toCallBB} BB
                            </strong>
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                      {currentStep.prompt}
                    </p>
                  </div>

                  {/* Action Choice Buttons OR Street Feedback Card */}
                  {!selectedChoice && !isHandComplete ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Choose Your Action ({currentPuzzle.heroPosition})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {currentStep.choices.map((choice) => {
                          const isFold = choice.actionType === 'fold';
                          const isAllIn = choice.actionType === 'all-in';
                          const isRaiseOrBet =
                            choice.actionType === 'raise' ||
                            choice.actionType === 'bet';

                          return (
                            <button
                              key={choice.id}
                              onClick={() => handleChooseAction(choice)}
                              className={`p-3 rounded-xl border text-left transition active:scale-[0.98] flex flex-col justify-between min-h-[64px] shadow-md ${
                                isAllIn
                                  ? 'bg-gradient-to-br from-rose-950/90 to-slate-900 border-rose-500/40 hover:border-rose-400'
                                  : isRaiseOrBet
                                  ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500/40 hover:border-emerald-400'
                                  : isFold
                                  ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                                  : 'bg-gradient-to-br from-sky-950/80 to-slate-900 border-sky-500/40 hover:border-sky-400'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                  {choice.actionType}
                                </span>
                                {choice.amountBB !== undefined && (
                                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-200">
                                    {choice.amountBB} BB
                                  </span>
                                )}
                              </div>
                              <div className="text-sm font-extrabold text-white mt-1">
                                {choice.label}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : selectedChoice ? (
                    /* Immediate Street Move Evaluation Card (Chess.com style) */
                    <div
                      className={`rounded-2xl border p-3.5 shadow-xl space-y-3 transition-all ${
                        GRADE_META[selectedChoice.grade].bgColor
                      } ${GRADE_META[selectedChoice.grade].borderColor}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-9 h-9 rounded-xl font-black text-base flex items-center justify-center shadow-md ${
                              GRADE_META[selectedChoice.grade].badgeBg
                            }`}
                          >
                            {GRADE_META[selectedChoice.grade].symbol}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-sm font-black ${
                                  GRADE_META[selectedChoice.grade].color
                                }`}
                              >
                                {GRADE_META[selectedChoice.grade].label}
                              </span>
                              <span className="text-xs text-slate-300 font-semibold">
                                • {selectedChoice.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                              EV:{' '}
                              <strong className="font-mono text-white">
                                {selectedChoice.evBB >= 0
                                  ? `+${selectedChoice.evBB}`
                                  : selectedChoice.evBB}{' '}
                                BB
                              </strong>{' '}
                              • Solver Freq:{' '}
                              <strong className="font-mono text-white">
                                {selectedChoice.gtoFrequency}%
                              </strong>
                            </p>
                          </div>
                        </div>

                        {selectedChoice.id !== currentBestChoice.id && (
                          <div className="text-right shrink-0 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">
                              Best Move
                            </div>
                            <div className="text-xs font-bold text-emerald-400">
                              {currentBestChoice.shortLabel} (
                              {currentBestChoice.evBB >= 0
                                ? `+${currentBestChoice.evBB}`
                                : currentBestChoice.evBB}{' '}
                              BB)
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Coach Explanation */}
                      <div className="bg-slate-950/75 rounded-xl p-2.5 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                        <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block mb-0.5">
                          GTO Coach Analysis
                        </span>
                        {selectedChoice.explanation}
                      </div>

                      {/* Street Transition Preview if another street follows */}
                      {currentStep.transitionText && (
                        <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{currentStep.transitionText}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleRetryHand}
                          className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Retry
                        </button>
                        <button
                          onClick={handleAdvanceStreetOrFinish}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
                        >
                          {stepIdx + 1 < currentPuzzle.steps.length ? (
                            currentPuzzle.steps[stepIdx + 1].street === currentStep.street ? (
                              <>
                                Continue Action ({currentStep.street.toUpperCase()})
                                <ChevronRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Deal Next Street (
                                {currentPuzzle.steps[stepIdx + 1].street.toUpperCase()})
                                <ChevronRight className="w-4 h-4" />
                              </>
                            )
                          ) : (
                            <>
                              Complete Hand & Review
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTableInReview(false)}
                      className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm"
                    >
                      Back to Full Hand Review
                    </button>
                  )}
                </div>

                {/* Desktop 2-Column Side-by-Side Layout (lg:) */}
                <div className="hidden lg:grid lg:grid-cols-12 lg:gap-5 lg:h-full lg:items-stretch overflow-hidden px-4 py-2.5">
                  {/* Left Column (lg:col-span-7 flex flex-col justify-center) */}
                  <div className="lg:col-span-7 flex flex-col justify-center min-h-0">
                    <PokerTableMobile
                      puzzle={currentPuzzle}
                      currentStep={currentStep}
                      revealVillainCards={isHandComplete}
                      lastChosenChoice={selectedChoice}
                    />
                  </div>

                  {/* Right Column (lg:col-span-5 flex flex-col justify-between gap-3 lg:overflow-y-auto pr-0.5) */}
                  <div className="lg:col-span-5 flex flex-col justify-between gap-3 lg:overflow-y-auto pr-0.5 min-h-0">
                    <div className="space-y-3">
                      {/* Puzzle Title & Street Progress Bar */}
                      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 shadow-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                Puzzle #{currentPuzzleIdx + 1} of {puzzleQueue.length}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                ELO {currentPuzzle.rating} • {currentPuzzle.difficulty}
                              </span>
                            </div>
                            <h1 className="text-sm font-bold text-white mt-1">
                              {currentPuzzle.title}
                            </h1>
                            <p className="text-xs text-slate-400">{currentPuzzle.subtitle}</p>
                          </div>

                          <button
                            onClick={handleNextPuzzle}
                            className="shrink-0 text-xs font-semibold text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 transition flex items-center gap-0.5"
                          >
                            Skip
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Multi-Street Progress Steps */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-1">
                            {currentPuzzle.steps.map((s, idx) => {
                              const completedRec = stepRecords[idx];
                              const isCurrent = idx === stepIdx && !isHandComplete;
                              const gradeMeta = completedRec
                                ? GRADE_META[completedRec.grade]
                                : null;

                              return (
                                <div
                                  key={s.stepIndex}
                                  className={`flex-1 h-7 rounded-lg px-2 flex items-center justify-between text-[11px] font-bold border transition ${
                                    completedRec && gradeMeta
                                      ? `${gradeMeta.bgColor} ${gradeMeta.borderColor} ${gradeMeta.color}`
                                      : isCurrent
                                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  <span className="uppercase">{s.street}</span>
                                  {completedRec && gradeMeta ? (
                                    <span
                                      className={`text-[10px] px-1 rounded font-black ${gradeMeta.badgeBg}`}
                                    >
                                      {gradeMeta.symbol}
                                    </span>
                                  ) : isCurrent ? (
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          {isHandComplete && (
                            <button
                              onClick={() => setShowTableInReview((v) => !v)}
                              className="px-2.5 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              {showTableInReview ? 'Review' : 'Table'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Situation Prompt Banner */}
                      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Decision Point • {currentStep.street.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            Pot: <strong className="text-slate-200">{currentStep.potBB} BB</strong>
                            {currentStep.toCallBB > 0 && (
                              <>
                                {' '}
                                • To Call:{' '}
                                <strong className="text-amber-300">
                                  {currentStep.toCallBB} BB
                                </strong>
                              </>
                            )}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                          {currentStep.prompt}
                        </p>
                      </div>
                    </div>

                    {/* Action Choice Buttons OR Street Feedback Card */}
                    <div>
                      {!selectedChoice && !isHandComplete ? (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                            Choose Your Action ({currentPuzzle.heroPosition})
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {currentStep.choices.map((choice) => {
                              const isFold = choice.actionType === 'fold';
                              const isAllIn = choice.actionType === 'all-in';
                              const isRaiseOrBet =
                                choice.actionType === 'raise' ||
                                choice.actionType === 'bet';

                              return (
                                <button
                                  key={choice.id}
                                  onClick={() => handleChooseAction(choice)}
                                  className={`p-3 rounded-xl border text-left transition active:scale-[0.98] flex flex-col justify-between min-h-[64px] shadow-md ${
                                    isAllIn
                                      ? 'bg-gradient-to-br from-rose-950/90 to-slate-900 border-rose-500/40 hover:border-rose-400'
                                      : isRaiseOrBet
                                      ? 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500/40 hover:border-emerald-400'
                                      : isFold
                                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-300'
                                      : 'bg-gradient-to-br from-sky-950/80 to-slate-900 border-sky-500/40 hover:border-sky-400'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                      {choice.actionType}
                                    </span>
                                    {choice.amountBB !== undefined && (
                                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-200">
                                        {choice.amountBB} BB
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-extrabold text-white mt-1">
                                    {choice.label}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : selectedChoice ? (
                        /* Immediate Street Move Evaluation Card (Chess.com style) */
                        <div
                          className={`rounded-2xl border p-3.5 shadow-xl space-y-3 transition-all ${
                            GRADE_META[selectedChoice.grade].bgColor
                          } ${GRADE_META[selectedChoice.grade].borderColor}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-9 h-9 rounded-xl font-black text-base flex items-center justify-center shadow-md ${
                                  GRADE_META[selectedChoice.grade].badgeBg
                                }`}
                              >
                                {GRADE_META[selectedChoice.grade].symbol}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-sm font-black ${
                                      GRADE_META[selectedChoice.grade].color
                                    }`}
                                  >
                                    {GRADE_META[selectedChoice.grade].label}
                                  </span>
                                  <span className="text-xs text-slate-300 font-semibold">
                                    • {selectedChoice.label}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300">
                                  EV:{' '}
                                  <strong className="font-mono text-white">
                                    {selectedChoice.evBB >= 0
                                      ? `+${selectedChoice.evBB}`
                                      : selectedChoice.evBB}{' '}
                                    BB
                                  </strong>{' '}
                                  • Solver Freq:{' '}
                                  <strong className="font-mono text-white">
                                    {selectedChoice.gtoFrequency}%
                                  </strong>
                                </p>
                              </div>
                            </div>

                            {selectedChoice.id !== currentBestChoice.id && (
                              <div className="text-right shrink-0 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                                <div className="text-[10px] text-slate-400 uppercase font-bold">
                                  Best Move
                                </div>
                                <div className="text-xs font-bold text-emerald-400">
                                  {currentBestChoice.shortLabel} (
                                  {currentBestChoice.evBB >= 0
                                    ? `+${currentBestChoice.evBB}`
                                    : currentBestChoice.evBB}{' '}
                                  BB)
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Coach Explanation */}
                          <div className="bg-slate-950/75 rounded-xl p-2.5 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                            <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block mb-0.5">
                              GTO Coach Analysis
                            </span>
                            {selectedChoice.explanation}
                          </div>

                          {/* Street Transition Preview if another street follows */}
                          {currentStep.transitionText && (
                            <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2">
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>{currentStep.transitionText}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={handleRetryHand}
                              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Retry
                            </button>
                            <button
                              onClick={handleAdvanceStreetOrFinish}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition"
                            >
                              {stepIdx + 1 < currentPuzzle.steps.length ? (
                                currentPuzzle.steps[stepIdx + 1].street === currentStep.street ? (
                                  <>
                                    Continue Action ({currentStep.street.toUpperCase()})
                                    <ChevronRight className="w-4 h-4" />
                                  </>
                                ) : (
                                  <>
                                    Deal Next Street (
                                    {currentPuzzle.steps[stepIdx + 1].street.toUpperCase()})
                                    <ChevronRight className="w-4 h-4" />
                                  </>
                                )
                              ) : (
                                <>
                                  Complete Hand & Review
                                  <ChevronRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowTableInReview(false)}
                          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg transition"
                        >
                          Back to Full Hand Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Full Post-Hand Chess.com-style Review Screen */
              <>
                {/* Mobile Single-Column Review (< lg) */}
                <div className="lg:hidden px-3 pt-2.5 pb-4">
                  <HandReviewPanel
                    puzzle={currentPuzzle}
                    stepRecords={stepRecords}
                    onRetry={handleRetryHand}
                    onNextPuzzle={handleNextPuzzle}
                    onSelectStepForReplay={(idx) => {
                      setStepIdx(idx);
                      setShowTableInReview(true);
                    }}
                  />
                </div>

                {/* Desktop 2-Column Side-by-Side Table + Review Panel (lg:) */}
                <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 lg:h-full lg:items-stretch overflow-hidden px-4 py-2.5">
                  {/* Left Column: Final Showdown Table with villain cards revealed */}
                  <div className="lg:col-span-6 flex flex-col justify-center min-h-0">
                    <PokerTableMobile
                      puzzle={currentPuzzle}
                      currentStep={currentPuzzle.steps[currentPuzzle.steps.length - 1]}
                      revealVillainCards={true}
                      lastChosenChoice={
                        stepRecords.length > 0
                          ? currentPuzzle.steps[currentPuzzle.steps.length - 1]?.choices.find(
                              (c) =>
                                c.id ===
                                stepRecords[stepRecords.length - 1]?.chosenActionId
                            ) || null
                          : null
                      }
                    />
                  </div>

                  {/* Right Column: Scrollable Hand Review Panel */}
                  <div className="lg:col-span-6 lg:h-full lg:overflow-y-auto pr-1 min-h-0">
                    <HandReviewPanel
                      puzzle={currentPuzzle}
                      stepRecords={stepRecords}
                      onRetry={handleRetryHand}
                      onNextPuzzle={handleNextPuzzle}
                      onSelectStepForReplay={(idx) => {
                        setStepIdx(idx);
                        setShowTableInReview(true);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {(activeTab === 'practice' || activeTab === 'stats') && (
          <div className="px-3 pt-2.5 pb-6 max-w-4xl mx-auto w-full lg:overflow-y-auto">
            <StatsAndPracticeView
              puzzles={POKER_PUZZLES}
              history={history}
              activeTab={activeTab}
              onSelectPuzzle={(puzzle) => startPuzzle(puzzle)}
              onStartFilteredQueue={handleStartFilteredQueue}
              onClearHistory={handleClearHistory}
            />
          </div>
        )}
      </main>

      {/* Bottom Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 px-4 py-1.5 flex items-center justify-around lg:hidden">
        <button
          onClick={() => setActiveTab('play')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition ${
            activeTab === 'play'
              ? 'text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Spade className="w-5 h-5" />
          <span className="text-[11px] font-bold">Play Puzzle</span>
        </button>

        <button
          onClick={() => setActiveTab('practice')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition ${
            activeTab === 'practice'
              ? 'text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[11px] font-bold">Practice Setups</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition relative ${
            activeTab === 'stats'
              ? 'text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px] font-bold">Stats & Leaks</span>
          {stats.weaknesses.length > 0 && (
            <span
              className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-400"
              title="Leaks detected to practice"
            />
          )}
        </button>
      </nav>
    </div>
  );
}

export default App;

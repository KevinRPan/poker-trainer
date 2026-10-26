import React, { useState } from 'react';
import type { PokerPuzzle, StepAttemptRecord, MoveGrade, DecisionStep, ActionChoice } from '../types/poker';
import { GRADE_META, calculateHandAccuracy } from '../utils/grades';
import { PlayingCard } from './PlayingCard';
import {
  RotateCcw,
  ArrowRight,
  Sparkles,
  Eye,
  Layers,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export interface HandReviewPanelProps {
  puzzle: PokerPuzzle;
  stepRecords: StepAttemptRecord[];
  onRetry: () => void;
  onNextPuzzle: () => void;
  /** Replay from this street onward (keeps earlier decisions). */
  onRetryFromStep?: (stepIndex: number) => void;
  onSelectStepForReplay?: (stepIndex: number) => void;
}

const ORDERED_GRADES: MoveGrade[] = [
  'brilliant',
  'best',
  'good',
  'inaccuracy',
  'mistake',
  'blunder',
];

export const HandReviewPanel: React.FC<HandReviewPanelProps> = ({
  puzzle,
  stepRecords,
  onRetry,
  onNextPuzzle,
  onRetryFromStep,
  onSelectStepForReplay,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>(() => {
    // Expand all steps by default so user can immediately study coach notes
    const initial: Record<number, boolean> = {};
    puzzle.steps.forEach((s) => {
      initial[s.stepIndex] = true;
    });
    return initial;
  });

  const toggleStepExpanded = (stepIndex: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepIndex]: !prev[stepIndex],
    }));
  };

  // 1. Calculate accuracy, overall grade, and total EV lost
  const { accuracyScore, overallGrade, totalEvLostBB } = calculateHandAccuracy(stepRecords);
  const overallMeta = GRADE_META[overallGrade] ?? GRADE_META.best;

  // 2. Count grades for Chess.com-style tally grid
  const gradeCounts: Record<MoveGrade, number> = {
    brilliant: 0,
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };

  stepRecords.forEach((record) => {
    if (gradeCounts[record.grade] !== undefined) {
      gradeCounts[record.grade]++;
    }
  });

  // Find villain seat with revealed hole cards
  const villainSeat = puzzle.seats.find((s) => s.villainCards && !s.isHero);

  // Helper for street board display
  const getStreetLabel = (street: string) => street.toUpperCase();

  return (
    <div className="w-full max-w-md lg:max-w-none mx-auto flex flex-col text-slate-100 pb-36 lg:pb-8">
      {/* ======================================================== */}
      {/* 1. REPORT CARD HEADER: Chess.com Game Review Style       */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden mb-4">
        {/* Ambient background glow matching overall grade */}
        <div
          className={`absolute -top-12 -right-12 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
            overallGrade === 'brilliant'
              ? 'bg-cyan-400'
              : overallGrade === 'best'
              ? 'bg-emerald-400'
              : overallGrade === 'good'
              ? 'bg-lime-400'
              : overallGrade === 'inaccuracy'
              ? 'bg-amber-400'
              : overallGrade === 'mistake'
              ? 'bg-orange-500'
              : 'bg-rose-500'
          }`}
        />

        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
              <Award className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Hand Review Report
              </h2>
              <p className="text-xs text-slate-400 line-clamp-1">{puzzle.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {puzzle.format.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onNextPuzzle}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black transition shadow-sm"
            >
              Next Hand
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Big Accuracy Score & Overall Grade Banner */}
        <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 mb-4">
          {/* Accuracy Circular KPI */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 shadow-inner">
              <span className="text-xl font-black tracking-tight text-white">
                {accuracyScore}
                <span className="text-xs font-semibold text-slate-400">%</span>
              </span>
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Accuracy Score
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${overallMeta.badgeBg}`}
                >
                  <span>{overallMeta.symbol}</span>
                  <span>{overallMeta.label}</span>
                </span>
              </div>
            </div>
          </div>

          {/* EV Lost Badge */}
          <div className="text-right">
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              Total EV Lost
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-1">
              {totalEvLostBB > 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-sm font-black text-rose-400">
                    -{totalEvLostBB.toFixed(2)} BB
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-sm font-black text-emerald-400">0.00 BB (Optimal)</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {totalEvLostBB === 0 ? 'Flawless GTO line' : 'vs Solver Benchmark'}
            </div>
          </div>
        </div>

        {/* Chess.com-Style Move Classification Tally Grid */}
        <div className="grid grid-cols-3 gap-2">
          {ORDERED_GRADES.map((g) => {
            const meta = GRADE_META[g];
            const count = gradeCounts[g];
            const hasMoves = count > 0;

            return (
              <div
                key={g}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  hasMoves
                    ? `${meta.bgColor} ${meta.borderColor}`
                    : 'bg-slate-900/40 border-slate-800/40 opacity-45'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-black shrink-0 ${meta.badgeBg}`}
                  >
                    {meta.symbol}
                  </span>
                  <span
                    className={`text-[11px] font-bold truncate ${
                      hasMoves ? meta.color : 'text-slate-400'
                    }`}
                  >
                    {meta.label}
                  </span>
                </div>
                <span
                  className={`text-xs font-black ml-1 ${
                    hasMoves ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SHOWDOWN & VILLAIN REVEAL CARD                        */}
      {/* ======================================================== */}
      <section className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 shadow-xl mb-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Showdown & Villain Reveal</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Full Cards Revealed
          </span>
        </div>

        {/* Head-to-head card confrontation */}
        <div className="flex items-center justify-around bg-slate-950/80 border border-slate-800/60 rounded-xl p-3 mb-3">
          {/* Hero Hole Cards */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1.5">
              Hero ({puzzle.heroPosition})
            </div>
            <div className="flex -space-x-1">
              <PlayingCard card={puzzle.heroCards[0]} size="sm" />
              <PlayingCard card={puzzle.heroCards[1]} size="sm" />
            </div>
          </div>

          {/* VS Center Marker */}
          <div className="flex flex-col items-center px-2">
            <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] font-black text-amber-400 shadow-md">
              VS
            </div>
            <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">
              Showdown
            </span>
          </div>

          {/* Villain Hole Cards */}
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider mb-1.5">
              {villainSeat?.name || 'Villain'} ({villainSeat?.position || 'Opponent'})
            </div>
            {villainSeat?.villainCards ? (
              <div className="flex -space-x-1">
                <PlayingCard card={villainSeat.villainCards[0]} size="sm" highlight />
                <PlayingCard card={villainSeat.villainCards[1]} size="sm" highlight />
              </div>
            ) : (
              <div className="flex -space-x-1">
                <PlayingCard hidden size="sm" />
                <PlayingCard hidden size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Coach Showdown Narrative Story */}
        <div className="bg-slate-950/60 rounded-xl p-3 border-l-3 border-emerald-500 text-xs leading-relaxed text-slate-300">
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Coach Breakdown:</span>
          </div>
          <p>{puzzle.showdownSummary}</p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. STREET-BY-STREET MOVE BREAKDOWN                       */}
      {/* ======================================================== */}
      <section className="space-y-3 mb-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Street-by-Street Decision Breakdown</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {stepRecords.length} / {puzzle.steps.length} Streets Played
          </span>
        </div>

        {puzzle.steps.map((step: DecisionStep, i: number) => {
          const record = stepRecords.find((r) => r.stepIndex === step.stepIndex) || stepRecords[i];
          if (!record) return null;

          const stepGradeMeta = GRADE_META[record.grade] ?? GRADE_META.best;
          const isExpanded = !!expandedSteps[step.stepIndex];
          const isOptimal = record.grade === 'best' || record.grade === 'brilliant';

          return (
            <div
              key={step.stepIndex}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOptimal
                  ? 'bg-slate-900/90 border-slate-800'
                  : 'bg-slate-900/90 border-slate-700/80 shadow-md'
              }`}
            >
              {/* Street Card Header (clickable to collapse/expand) */}
              <div
                onClick={() => toggleStepExpanded(step.stepIndex)}
                className="p-3.5 bg-slate-950/60 flex items-center justify-between cursor-pointer border-b border-slate-800/80 hover:bg-slate-950/90 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                    {getStreetLabel(step.street)}
                  </span>

                  {/* Board cards at this street */}
                  {step.board.length > 0 && (
                    <div className="flex items-center gap-1">
                      {step.board.map((card, idx) => (
                        <PlayingCard
                          key={`${card.rank}${card.suit}-${idx}`}
                          card={card}
                          size="xs"
                          highlight={
                            (step.street === 'flop' && idx < 3) ||
                            (step.street === 'turn' && idx === 3) ||
                            (step.street === 'river' && idx === 4)
                          }
                        />
                      ))}
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400 font-semibold">
                    Pot: {step.potBB} BB
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded ${stepGradeMeta.badgeBg}`}
                  >
                    <span>{stepGradeMeta.symbol}</span>
                    <span className="hidden sm:inline">{stepGradeMeta.label}</span>
                  </span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-200 p-0.5"
                    aria-label={isExpanded ? 'Collapse step' : 'Expand step'}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Move Outcome Summary Bar */}
              <div className="px-3.5 py-2.5 bg-slate-950/30 flex items-center justify-between text-xs border-b border-slate-800/40">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400">You played:</span>
                  <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {record.chosenActionLabel}
                  </span>
                  <span
                    className={`font-black ${
                      record.evChosenBB >= 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    ({record.evChosenBB >= 0 ? `+${record.evChosenBB}` : record.evChosenBB} BB)
                  </span>
                </div>

                {/* If suboptimal, display how much EV was lost */}
                {!isOptimal && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>-{record.evLostBB.toFixed(2)} BB Lost</span>
                  </div>
                )}
              </div>

              {/* Expandable Coach Explanation & Solver Frequency List */}
              {isExpanded && (
                <div className="p-3.5 space-y-3">
                  {/* Suboptimal Correction Note */}
                  {!isOptimal && (
                    <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                      <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Solver Recommendation: </span>
                        The best move was{' '}
                        <strong className="text-white underline">{record.bestActionLabel}</strong> (
                        {record.evBestBB >= 0 ? `+${record.evBestBB}` : record.evBestBB} BB). You
                        sacrificed{' '}
                        <strong className="text-rose-300">
                          {record.evLostBB.toFixed(2)} BB
                        </strong>{' '}
                        in long-run EV here.
                      </div>
                    </div>
                  )}

                  {/* All Choices with GTO Solver Frequency Bars */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Solver Frequency & Action Analysis:
                    </div>

                    {step.choices.map((choice: ActionChoice) => {
                      const isChosen = choice.id === record.chosenActionId;
                      const choiceGradeMeta = GRADE_META[choice.grade];
                      const isBestSolverChoice =
                        choice.id === record.bestActionId || choice.grade === 'best';

                      return (
                        <div
                          key={choice.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isChosen
                              ? 'bg-slate-800/90 border-slate-600 shadow-xs'
                              : 'bg-slate-950/40 border-slate-800/70 opacity-90'
                          }`}
                        >
                          {/* Row 1: Action Header & EV & Frequency */}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`flex items-center justify-center w-4 h-4 rounded text-[10px] font-black ${choiceGradeMeta.badgeBg}`}
                              >
                                {choiceGradeMeta.symbol}
                              </span>
                              <span className="font-bold text-white">{choice.label}</span>

                              {isChosen && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                                  Your Pick
                                </span>
                              )}

                              {isBestSolverChoice && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Solver Best
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-black ${
                                  choice.evBB >= 0 ? 'text-emerald-400' : 'text-slate-400'
                                }`}
                              >
                                {choice.evBB >= 0 ? `+${choice.evBB}` : choice.evBB} BB
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {choice.gtoFrequency}% Freq
                              </span>
                            </div>
                          </div>

                          {/* Row 2: Visual GTO Solver Frequency Bar */}
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden mb-2 border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                choice.grade === 'brilliant'
                                  ? 'bg-cyan-400'
                                  : choice.grade === 'best'
                                  ? 'bg-emerald-400'
                                  : choice.grade === 'good'
                                  ? 'bg-lime-400'
                                  : choice.grade === 'inaccuracy'
                                  ? 'bg-amber-400'
                                  : choice.grade === 'mistake'
                                  ? 'bg-orange-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.max(2, choice.gtoFrequency)}%` }}
                            />
                          </div>

                          {/* Row 3: Coach Explanation */}
                          <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                            {choice.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Per-street retry / inspect */}
                  {(onRetryFromStep || onSelectStepForReplay) && (
                    <div className="pt-1 flex items-center justify-end gap-3">
                      {onSelectStepForReplay && (
                        <button
                          type="button"
                          onClick={() => onSelectStepForReplay(step.stepIndex)}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 p-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Table</span>
                        </button>
                      )}
                      {onRetryFromStep && (
                        <button
                          type="button"
                          onClick={() => onRetryFromStep(step.stepIndex)}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 p-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry This Move</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ======================================================== */}
      {/* 4. BOTTOM ACTION BAR: above mobile nav, sticky on desktop */}
      {/* ======================================================== */}
      <footer className="fixed lg:sticky bottom-16 lg:bottom-0 left-0 right-0 z-30 p-3 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 max-w-md lg:max-w-none mx-auto shadow-2xl mt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 active:scale-98 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
            <span>Retry Hand</span>
          </button>

          <button
            type="button"
            onClick={onNextPuzzle}
            className="flex-[1.6] py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 active:scale-98 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25"
          >
            <span>Next Hand</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HandReviewPanel;

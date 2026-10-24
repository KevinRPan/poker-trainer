import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History, X } from 'lucide-react';
import type {
  ActionChoice,
  ActionLogItem,
  Card,
  DecisionStep,
  PlayerSeat,
  PokerPuzzle,
  Street,
  TableFormat,
} from '../types/poker';
import { GRADE_META } from '../utils/grades';
import { PlayingCard } from './PlayingCard';

export interface PokerTableMobileProps {
  puzzle: PokerPuzzle;
  currentStep: DecisionStep;
  revealVillainCards?: boolean;
  lastChosenChoice?: ActionChoice | null;
}

const FORMAT_LABELS: Record<TableFormat, string> = {
  'cash-6max': '6-Max Cash',
  'cash-9max': '9-Max Full Ring',
  mtt: 'MTT Tourney',
  'heads-up': 'Heads-Up',
};

const STREET_ORDER: Street[] = ['preflop', 'flop', 'turn', 'river'];

function getSeatPositionStyle(index: number, totalOpponents: number): React.CSSProperties {
  // Heads-Up (1 opponent): top center
  if (totalOpponents === 1) {
    return {
      top: '5%',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  }

  // 2 Opponents: top-left and top-right
  if (totalOpponents === 2) {
    if (index === 0) return { top: '9%', left: '18%', transform: 'translateX(-50%)' };
    return { top: '9%', right: '18%', transform: 'translateX(50%)' };
  }

  // 3 Opponents
  if (totalOpponents === 3) {
    if (index === 0) return { top: '40%', left: '3%', transform: 'translateY(-50%)' };
    if (index === 1) return { top: '4%', left: '50%', transform: 'translateX(-50%)' };
    return { top: '40%', right: '3%', transform: 'translateY(-50%)' };
  }

  // 4 Opponents
  if (totalOpponents === 4) {
    if (index === 0) return { top: '60%', left: '3%', transform: 'translateY(-50%)' };
    if (index === 1) return { top: '22%', left: '3%', transform: 'translateY(-50%)' };
    if (index === 2) return { top: '22%', right: '3%', transform: 'translateY(-50%)' };
    return { top: '60%', right: '3%', transform: 'translateY(-50%)' };
  }

  // 5 Opponents (Standard 6-Max)
  if (totalOpponents === 5) {
    switch (index) {
      case 0: // Left Lower
        return { top: '65%', left: '2.5%', transform: 'translateY(-50%)' };
      case 1: // Left Upper
        return { top: '25%', left: '2.5%', transform: 'translateY(-50%)' };
      case 2: // Top Center
        return { top: '4%', left: '50%', transform: 'translateX(-50%)' };
      case 3: // Right Upper
        return { top: '25%', right: '2.5%', transform: 'translateY(-50%)' };
      case 4: // Right Lower
        return { top: '65%', right: '2.5%', transform: 'translateY(-50%)' };
      default:
        return {};
    }
  }

  // 6 to 8 Opponents (9-Max / Full Ring)
  const nineMaxPositions: React.CSSProperties[] = [
    { top: '72%', left: '2%', transform: 'translateY(-50%)' },
    { top: '49%', left: '1.5%', transform: 'translateY(-50%)' },
    { top: '26%', left: '2%', transform: 'translateY(-50%)' },
    { top: '3%', left: '30%', transform: 'translateX(-50%)' },
    { top: '3%', left: '70%', transform: 'translateX(-50%)' },
    { top: '26%', right: '2%', transform: 'translateY(-50%)' },
    { top: '49%', right: '1.5%', transform: 'translateY(-50%)' },
    { top: '72%', right: '2%', transform: 'translateY(-50%)' },
  ];

  return nineMaxPositions[index % nineMaxPositions.length];
}

export const PokerTableMobile: React.FC<PokerTableMobileProps> = ({
  puzzle,
  currentStep,
  revealVillainCards = false,
  lastChosenChoice = null,
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Identify Hero seat
  const heroSeat = puzzle.seats.find(
    (s) => s.isHero || s.position === puzzle.heroPosition
  );

  // Identify Opponents (all non-hero seats)
  const opponentSeats = puzzle.seats.filter(
    (s) => !s.isHero && s.position !== puzzle.heroPosition
  );

  // Sort opponents clockwise starting from Hero's left
  const sortedOpponents: PlayerSeat[] = [...opponentSeats].sort((a, b) => {
    if (
      typeof a.seatIndex === 'number' &&
      typeof b.seatIndex === 'number' &&
      typeof heroSeat?.seatIndex === 'number'
    ) {
      const tableMod = puzzle.tableSize || puzzle.seats.length || 9;
      const offsetA = (a.seatIndex - heroSeat.seatIndex + tableMod) % tableMod;
      const offsetB = (b.seatIndex - heroSeat.seatIndex + tableMod) % tableMod;
      return offsetA - offsetB;
    }
    return 0;
  });

  // Table Size label
  const tableSizeBadge =
    puzzle.format === 'heads-up' || puzzle.tableSize === 2
      ? 'Heads-Up'
      : puzzle.format === 'mtt'
      ? 'MTT'
      : `${puzzle.tableSize}-Max`;

  // Combine actions for Bet History
  const allActions: ActionLogItem[] = [
    ...(puzzle.preflopAndPriorHistory || []),
    ...(currentStep.priorActionsThisStreet || []),
  ];

  // Group actions by street for the history drawer
  const streetGroups = STREET_ORDER.map((street) => {
    const actions = allActions.filter((a) => a.street === street);
    let boardCards: Card[] = [];
    if (street === 'flop') {
      boardCards = currentStep.board.slice(0, 3);
    } else if (street === 'turn' && currentStep.board.length >= 4) {
      boardCards = [currentStep.board[3]];
    } else if (street === 'river' && currentStep.board.length >= 5) {
      boardCards = [currentStep.board[4]];
    }
    return { street, actions, boardCards };
  }).filter((group) => group.actions.length > 0);

  return (
    <div className="w-full max-w-md lg:max-w-lg mx-auto flex flex-col font-sans select-none relative">
      {/* Top Bar inside table area */}
      <div className="w-full px-3 py-1.5 sm:py-2 bg-slate-900/95 border-b border-slate-800/80 rounded-t-2xl flex items-center justify-between gap-2 shadow-md z-20">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* Format Badge */}
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {FORMAT_LABELS[puzzle.format] || puzzle.format}
          </span>
          {/* Table Size Badge */}
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
            {tableSizeBadge}
          </span>
          {/* Blinds / ICM text */}
          <span
            className="text-[11px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[170px]"
            title={puzzle.blindsText}
          >
            {puzzle.blindsText}
          </span>
        </div>

        {/* Toggleable Bet History Pill */}
        <button
          type="button"
          onClick={() => setIsHistoryOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 shadow-xs transition-colors shrink-0"
          aria-expanded={isHistoryOpen}
          aria-label="Toggle bet history"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span>History</span>
          {allActions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
              {allActions.length}
            </span>
          )}
          {isHistoryOpen ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>
      </div>

      {/* Vertical Stadium / Oval Felt Poker Table */}
      <div className="relative w-full h-[500px] sm:h-[530px] lg:h-[calc(100dvh-140px)] min-h-[390px] sm:min-h-[410px] lg:min-h-[420px] lg:max-h-[calc(100dvh-120px)] bg-gradient-to-b from-emerald-900/90 to-emerald-950 border-4 border-amber-900/60 shadow-2xl rounded-[90px] sm:rounded-[110px] overflow-hidden my-1.5 lg:my-0">
        {/* Inner felt rail accent */}
        <div className="absolute inset-2 sm:inset-3 border border-emerald-500/20 rounded-[100px] pointer-events-none" />

        {/* Center spotlight gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_rgba(6,78,59,0)_70%)] pointer-events-none" />

        {/* OPPONENT SEATS AROUND PERIMETER */}
        {sortedOpponents.map((seat, index) => {
          const isVillain = seat.position === currentStep.villainPosition;
          const isFolded = !seat.isActive && !isVillain;
          const posStyle = getSeatPositionStyle(index, sortedOpponents.length);
          const effectiveStack = isVillain
            ? (currentStep.villainStackBB ?? seat.stackBB)
            : seat.stackBB;
          const showCards = !isFolded && (isVillain || seat.isActive);

          return (
            <div
              key={seat.seatIndex ?? seat.position ?? index}
              style={posStyle}
              className={`absolute flex flex-col items-center transition-all duration-200 ${
                isFolded ? 'opacity-45 grayscale-[20%]' : ''
              } ${isVillain ? 'z-20' : 'z-10'}`}
            >
              {/* Opponent Cards */}
              {showCards && (
                <div className="flex -space-x-3 mb-1">
                  {isVillain && revealVillainCards && seat.villainCards ? (
                    <>
                      <PlayingCard
                        card={seat.villainCards[0]}
                        size="xs"
                        highlight={isVillain}
                      />
                      <PlayingCard
                        card={seat.villainCards[1]}
                        size="xs"
                        highlight={isVillain}
                      />
                    </>
                  ) : (
                    <>
                      <PlayingCard hidden size="xs" highlight={isVillain} />
                      <PlayingCard hidden size="xs" highlight={isVillain} />
                    </>
                  )}
                </div>
              )}

              {/* Player Info Badge */}
              <div
                className={`flex flex-col items-center px-1.5 py-1 rounded-lg backdrop-blur-sm border transition-all ${
                  isVillain
                    ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/25'
                    : 'bg-slate-950/85 border-slate-700/60 shadow-sm'
                }`}
              >
                {/* Position Pill + Name */}
                <div className="flex items-center gap-1 leading-none">
                  <span
                    className={`px-1 py-0.5 rounded text-[9px] font-black uppercase tracking-tight ${
                      isVillain
                        ? 'bg-amber-400 text-slate-950'
                        : seat.position === 'BTN'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                        : seat.position === 'SB' || seat.position === 'BB'
                        ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {seat.position}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-200 truncate max-w-[48px]">
                    {seat.name}
                  </span>
                </div>

                {/* Stack in BB */}
                <div className="text-[10px] font-bold text-slate-300 mt-0.5 leading-none">
                  <span
                    className={
                      isVillain ? 'text-amber-300 font-extrabold' : 'text-slate-100'
                    }
                  >
                    {effectiveStack}
                  </span>{' '}
                  <span className="text-[8px] text-slate-400 font-normal">BB</span>
                </div>

                {/* Player Tag */}
                {seat.tag && (
                  <span className="text-[8px] text-amber-200/80 font-medium truncate max-w-[58px] mt-0.5 leading-none">
                    {seat.tag}
                  </span>
                )}
              </div>

              {/* Current Bet Chip */}
              {seat.currentBetBB && seat.currentBetBB > 0 && (
                <div className="mt-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-full text-[9px] font-bold text-amber-300 shadow-sm leading-none flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  {seat.currentBetBB} BB
                </div>
              )}
            </div>
          );
        })}

        {/* CENTER FELT AREA: POT, COMMUNITY CARDS, STREET INDICATOR */}
        <div className="absolute top-[43%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10 w-full px-2">
          {/* Street indicator and Total Pot */}
          <div className="flex items-center gap-2 mb-2 pointer-events-auto">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 shadow-xs">
              {currentStep.street}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-amber-500/50 shadow-lg text-amber-300 font-bold text-xs sm:text-sm">
              <span className="text-[10px] text-amber-400 font-black tracking-wider uppercase">
                POT
              </span>
              <span className="text-white font-black">{currentStep.potBB}</span>
              <span className="text-[10px] text-amber-300/90 font-semibold">BB</span>
            </div>
          </div>

          {/* 5 Community Card Slots */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 pointer-events-auto">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const boardCard = currentStep.board[slotIdx];
              return (
                <PlayingCard
                  key={slotIdx}
                  card={boardCard}
                  size="sm"
                  className={boardCard ? 'shadow-md' : 'opacity-60'}
                />
              );
            })}
          </div>
        </div>

        {/* HERO SEAT (ANCHORED PROMINENTLY AT BOTTOM CENTER) */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
          {/* Hero Cards & Floating Chess.com-style Grade Badge */}
          <div className="relative flex items-center justify-center">
            <div className="flex -space-x-2.5 shadow-2xl">
              <PlayingCard
                card={puzzle.heroCards[0]}
                size="md"
                className="transform -rotate-4 hover:rotate-0 transition-transform origin-bottom drop-shadow-md"
              />
              <PlayingCard
                card={puzzle.heroCards[1]}
                size="md"
                className="transform rotate-4 hover:rotate-0 transition-transform origin-bottom drop-shadow-md"
              />
            </div>

            {/* Chess.com-style Move Grade Floating Badge */}
            {lastChosenChoice && (
              <div
                className={`absolute -top-3.5 -right-3.5 z-30 flex items-center justify-center w-8 h-8 rounded-full shadow-xl border-2 border-slate-950 font-black text-sm ${
                  GRADE_META[lastChosenChoice.grade].badgeBg
                } transition-transform hover:scale-110`}
                title={`${GRADE_META[lastChosenChoice.grade].label}: ${lastChosenChoice.label}`}
              >
                {GRADE_META[lastChosenChoice.grade].symbol}
              </div>
            )}
          </div>

          {/* Hero Pill: Position, Name, Stack */}
          <div className="mt-1 flex items-center gap-1.5 px-3 py-1 bg-slate-950/95 border border-emerald-500/60 rounded-full shadow-lg">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
              {puzzle.heroPosition}
            </span>
            <span className="text-xs font-bold text-slate-100">Hero</span>
            <span className="text-slate-600 text-[10px]">•</span>
            <span className="text-xs font-extrabold text-emerald-400">
              {currentStep.heroStackBB}{' '}
              <span className="text-[10px] font-medium text-emerald-300/80">BB</span>
            </span>
          </div>

          {/* Move Feedback Banner if choice is made */}
          {lastChosenChoice && (
            <div
              className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shadow-sm ${
                GRADE_META[lastChosenChoice.grade].bgColor
              } ${GRADE_META[lastChosenChoice.grade].borderColor} ${
                GRADE_META[lastChosenChoice.grade].color
              }`}
            >
              <span>{GRADE_META[lastChosenChoice.grade].symbol}</span>
              <span>{GRADE_META[lastChosenChoice.grade].label}</span>
              <span className="text-slate-400 font-normal">
                ({lastChosenChoice.shortLabel || lastChosenChoice.label})
              </span>
            </div>
          )}
        </div>

        {/* BET HISTORY DRAWER OVERLAY */}
        {isHistoryOpen && (
          <div className="absolute inset-x-2 top-2 bottom-3 bg-slate-950/95 border border-slate-700/80 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex flex-col z-40">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">Hand Bet History</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {allActions.length} actions
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close bet history"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-1">
              {streetGroups.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-8">
                  No prior actions recorded yet for this hand.
                </p>
              ) : (
                streetGroups.map(({ street, actions, boardCards }) => (
                  <div
                    key={street}
                    className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                        {street}
                      </span>
                      {boardCards.length > 0 && (
                        <div className="flex items-center gap-1">
                          {boardCards.map((c, i) => (
                            <PlayingCard key={i} card={c} size="xs" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {actions.map((act, actIdx) => {
                        const isHero = act.isHero || act.actor === puzzle.heroPosition;
                        const isVillain = act.actor === currentStep.villainPosition;

                        return (
                          <div
                            key={actIdx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-950/60 border border-slate-800/50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                  isHero
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isVillain
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {isHero
                                  ? `Hero (${act.actor})`
                                  : isVillain
                                  ? `Villain (${act.actor})`
                                  : act.actor}
                              </span>
                              <span className="text-slate-200 font-medium truncate">
                                {act.action}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-amber-300 shrink-0 ml-2">
                              Pot: {act.potAfterBB} BB
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokerTableMobile;

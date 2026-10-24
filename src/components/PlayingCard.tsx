import React, { useId } from 'react';
import type { Card, Suit } from '../types/poker';

export interface PlayingCardProps {
  card?: Card;
  hidden?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  highlight?: boolean;
  className?: string;
}

interface SuitStyle {
  symbol: string;
  name: string;
  color: string;
  badgeBg: string;
}

const SUIT_DATA: Record<Suit, SuitStyle> = {
  s: {
    symbol: '♠',
    name: 'Spades',
    color: 'text-slate-900',
    badgeBg: 'bg-slate-100',
  },
  h: {
    symbol: '♥',
    name: 'Hearts',
    color: 'text-rose-600',
    badgeBg: 'bg-rose-50',
  },
  d: {
    symbol: '♦',
    name: 'Diamonds',
    color: 'text-sky-500',
    badgeBg: 'bg-sky-50',
  },
  c: {
    symbol: '♣',
    name: 'Clubs',
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50',
  },
};

const SIZE_CLASSES = {
  xs: {
    container: 'w-7 h-10 rounded-[4px] p-0.5',
    rank: 'text-[11px] font-black leading-none tracking-tighter',
    suit: 'text-[10px] leading-none',
    centerSuit: 'text-[13px] leading-none',
    cornerPadding: 'p-0.5',
  },
  sm: {
    container: 'w-9 h-13 rounded-[5px] p-1',
    rank: 'text-xs font-black leading-none tracking-tight',
    suit: 'text-[11px] leading-none',
    centerSuit: 'text-base leading-none',
    cornerPadding: 'p-1',
  },
  md: {
    container: 'w-12 h-17 rounded-md p-1.5',
    rank: 'text-sm font-black leading-none',
    suit: 'text-xs leading-none',
    centerSuit: 'text-2xl leading-none',
    cornerPadding: 'p-1.5',
  },
  lg: {
    container: 'w-14 h-20 rounded-lg p-2',
    rank: 'text-base font-black leading-none',
    suit: 'text-sm leading-none',
    centerSuit: 'text-3xl leading-none',
    cornerPadding: 'p-2',
  },
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  hidden = false,
  size = 'md',
  highlight = false,
  className = '',
}) => {
  const patternId = useId();
  const sizeConfig = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  // Highlight styling
  const highlightClass = highlight
    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 shadow-lg shadow-amber-400/40 scale-105 z-10'
    : '';

  // 1. Hidden card back
  if (hidden) {
    return (
      <div
        aria-label="Face down card"
        className={`relative select-none flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-indigo-800 via-blue-900 to-indigo-950 border border-indigo-400/40 shadow-md ${sizeConfig.container} ${highlightClass} ${className}`}
      >
        <div className="w-full h-full rounded-[3px] border border-indigo-300/30 overflow-hidden relative flex items-center justify-center bg-indigo-950/40">
          <svg
            className="absolute inset-0 w-full h-full text-indigo-400/25"
            viewBox="0 0 40 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <pattern
              id={patternId}
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M4 0 L8 4 L4 8 L0 4 Z"
                stroke="currentColor"
                strokeWidth="0.75"
                fill="none"
              />
              <circle cx="4" cy="4" r="0.8" fill="currentColor" />
            </pattern>
            <rect width="40" height="56" fill={`url(#${patternId})`} />
          </svg>
          <div className="relative z-10 flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-indigo-300/40 bg-indigo-900/60 shadow-xs">
            <div className="w-1.5 h-1.5 rotate-45 bg-indigo-200/70" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty placeholder slot (undealt board card)
  if (!card) {
    return (
      <div
        aria-label="Empty card slot"
        className={`select-none flex-shrink-0 flex items-center justify-center bg-emerald-950/35 border-2 border-dashed border-emerald-600/30 shadow-inner ${sizeConfig.container} ${className}`}
      >
        <div className="w-2.5 h-3.5 rounded-[2px] border border-dashed border-emerald-500/25" />
      </div>
    );
  }

  // 3. Revealed face-up card with 4-color deck styling
  const suitInfo = SUIT_DATA[card.suit] ?? SUIT_DATA.s;
  const displayRank = card.rank === 'T' ? '10' : card.rank;
  const cardLabel = `${displayRank} of ${suitInfo.name}`;

  return (
    <div
      aria-label={cardLabel}
      className={`relative select-none flex-shrink-0 flex flex-col justify-between bg-gradient-to-b from-white via-slate-50 to-slate-100 border border-slate-300/90 shadow-md transition-transform duration-150 ${sizeConfig.container} ${suitInfo.color} ${highlightClass} ${className}`}
    >
      {/* Top-left corner */}
      <div className="flex flex-col items-start leading-none pointer-events-none">
        <span className={sizeConfig.rank}>{displayRank}</span>
        <span className={`${sizeConfig.suit} mt-0.5`}>{suitInfo.symbol}</span>
      </div>

      {/* Center suit symbol */}
      {size !== 'xs' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`${sizeConfig.centerSuit} opacity-90 drop-shadow-xs`}>
            {suitInfo.symbol}
          </span>
        </div>
      )}

      {/* Bottom-right corner (for sm, md, lg) */}
      {size !== 'xs' && (
        <div className="flex flex-col items-end leading-none rotate-180 pointer-events-none">
          <span className={sizeConfig.rank}>{displayRank}</span>
          <span className={`${sizeConfig.suit} mt-0.5`}>{suitInfo.symbol}</span>
        </div>
      )}
    </div>
  );
};

export default PlayingCard;

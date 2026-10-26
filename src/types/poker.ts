export type Suit = 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type TableFormat = 'cash-6max' | 'cash-9max' | 'mtt' | 'heads-up';

export type SetupTheme =
  | '3-Bet Pots'
  | 'River Bluff Catch'
  | 'ICM & Tournament'
  | 'C-Bet & Barrel'
  | 'Check-Raise Spots'
  | 'Heads-Up Battles'
  | 'Overbet Pressure';

export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export type MoveGrade =
  | 'brilliant'   // !! - Rare, high-IQ play (e.g. non-obvious bluff or hero call / overbet jam)
  | 'best'        // ★  - Highest EV GTO solver choice
  | 'good'        // ✓  - Close second / mixed frequency solver play
  | 'inaccuracy'  // ?! - Slight EV loss
  | 'mistake'     // ?  - Significant EV loss
  | 'blunder';    // ?? - Massive EV punt / catastrophic fold or spew

export type PositionName = 'BTN' | 'SB' | 'BB' | 'UTG' | 'UTG+1' | 'MP' | 'LJ' | 'HJ' | 'CO';

export interface PlayerSeat {
  seatIndex: number;
  name: string;
  position: PositionName;
  stackBB: number;
  isHero?: boolean;
  isActive: boolean; // still in the hand at start of puzzle or folded pre
  currentBetBB?: number;
  villainCards?: [Card, Card]; // revealed at end of hand review
  avatar?: string;
  tag?: string; // e.g., "TAG Reg", "Aggro Whale", "GTO Bot", "ICM Nit"
}

export interface ActionLogItem {
  street: Street;
  actor: PositionName;
  action: string; // e.g., "Raises to 2.5bb", "Calls 2.5bb", "Checks", "Bets 6.5bb"
  potAfterBB: number;
  isHero?: boolean;
}

export interface ActionChoice {
  id: string;
  label: string;          // e.g. "Fold", "Call 8bb", "Raise to 24bb", "All-In (42bb)"
  shortLabel: string;     // e.g. "Fold", "Call", "Raise 3x", "All-In"
  actionType: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amountBB?: number;
  grade: MoveGrade;
  evBB: number;           // Expected value in BB relative to start of node (e.g. +4.8, -1.2)
  gtoFrequency: number;   // Solver frequency percentage 0 - 100
  explanation: string;    // Why this move gets this grade (Chess.com coach style)
}

export interface DecisionStep {
  stepIndex: number;
  street: Street;
  board: Card[];          // 0 cards preflop, 3 flop, 4 turn, 5 river
  potBB: number;
  toCallBB: number;
  heroStackBB: number;
  villainStackBB: number;
  villainPosition: PositionName;
  prompt: string;         // Action cue only — do not narrate board/hand strength (visible on table)
  priorActionsThisStreet: ActionLogItem[];
  choices: ActionChoice[];
  transitionText?: string; // What happens after Hero acts to advance to the next street
}

export interface PokerPuzzle {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Master';
  rating: number;         // e.g. 1200, 1550, 1850, 2100
  format: TableFormat;
  themes: SetupTheme[];
  blindsText: string;     // e.g. "100bb Cash (0.5/1bb)" or "MTT Final Table (30bb eff, Bubble)"
  tableSize: 2 | 6 | 9;
  heroPosition: PositionName;
  heroCards: [Card, Card];
  seats: PlayerSeat[];
  preflopAndPriorHistory: ActionLogItem[];
  steps: DecisionStep[];
  showdownSummary: string; // Full hand wrap-up & villain hand reveal explanation
}

export interface StepAttemptRecord {
  stepIndex: number;
  street: Street;
  chosenActionId: string;
  chosenActionLabel: string;
  bestActionId: string;
  bestActionLabel: string;
  grade: MoveGrade;
  evLostBB: number;       // max(0, bestChoice.evBB - chosenChoice.evBB)
  evChosenBB: number;
  evBestBB: number;
}

export interface PuzzleAttemptHistory {
  id: string;
  puzzleId: string;
  puzzleTitle: string;
  format: TableFormat;
  themes: SetupTheme[];
  heroPosition: PositionName;
  timestamp: number;
  accuracyScore: number;  // 0 - 100 accuracy score (like Chess.com CAPS score)
  stepResults: StepAttemptRecord[];
  overallGrade: MoveGrade;
}

import type { PlayerSeat, PokerPuzzle, PositionName } from '../types/poker';

/** Shared 6-max cash seat layout; heroPosition marks the hero. */
function seats6max(
  heroPosition: PositionName,
  opts?: { villainPosition?: PositionName; openerBetBB?: number }
): PlayerSeat[] {
  const base: Omit<PlayerSeat, 'isHero' | 'isActive' | 'currentBetBB'>[] = [
    { seatIndex: 0, name: "Felix 'Fox' Vance", position: 'BTN', stackBB: 100, tag: 'TAG Reg' },
    { seatIndex: 1, name: 'Elena Rostova', position: 'SB', stackBB: 100, tag: 'Tight Reg' },
    { seatIndex: 2, name: 'Marcus Brody', position: 'BB', stackBB: 100, tag: 'Nit' },
    { seatIndex: 3, name: "Dave 'Dime' K.", position: 'UTG', stackBB: 100, tag: 'Fish' },
    { seatIndex: 4, name: 'Sarah Connor', position: 'MP', stackBB: 100, tag: 'LAG' },
    { seatIndex: 5, name: 'Alex Chen', position: 'CO', stackBB: 100, tag: 'GTO Bot' },
  ];

  return base.map((s) => {
    const isHero = s.position === heroPosition;
    const isVillain = opts?.villainPosition === s.position;
    return {
      ...s,
      name: isHero ? 'Hero' : s.name,
      isHero: isHero || undefined,
      isActive: true,
      currentBetBB:
        isVillain && opts?.openerBetBB
          ? opts.openerBetBB
          : s.position === 'SB'
            ? 0.5
            : s.position === 'BB'
              ? 1
              : undefined,
      tag: isHero ? undefined : s.tag,
    };
  });
}

/**
 * Single-street preflop fold / open / 3-bet drills.
 * Prompts describe prior action only — hole cards stay on the table.
 */
export const PREFLOP_PUZZLES: PokerPuzzle[] = [
  // --------------------------------------------------------------------------
  // PF-01: UTG open decision — fold offsuit broadway trash
  // --------------------------------------------------------------------------
  {
    id: 'preflop-01-utg-kjo-fold',
    title: 'UTG First In',
    subtitle: '6-max cash · open or fold',
    difficulty: 'Beginner',
    rating: 1200,
    format: 'cash-6max',
    themes: ['Preflop Ranges'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'UTG',
    heroCards: [
      { rank: 'K', suit: 'h' },
      { rank: 'J', suit: 'd' },
    ],
    seats: seats6max('UTG'),
    preflopAndPriorHistory: [],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 1.5,
        toCallBB: 1.0,
        heroStackBB: 100,
        villainStackBB: 100,
        villainPosition: 'BB',
        prompt: 'Folds to you UTG. What\'s your move?',
        priorActionsThisStreet: [],
        choices: [
          {
            id: 'pf01-c1',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'best',
            evBB: 0.0,
            gtoFrequency: 100,
            explanation:
              'KJo is a classic UTG fold at 100bb 6-max. It plays poorly multiway, dominates little, and loses too much when 3-bet.',
          },
          {
            id: 'pf01-c2',
            label: 'Raise to 2.5bb',
            shortLabel: 'Open 2.5x',
            actionType: 'raise',
            amountBB: 2.5,
            grade: 'mistake',
            evBB: -0.35,
            gtoFrequency: 0,
            explanation:
              'Opening KJo UTG is a common leak. You get called by better Kx/Jx and crushed by 3-bets from later positions.',
          },
          {
            id: 'pf01-c3',
            label: 'Raise to 3.5bb',
            shortLabel: 'Open 3.5x',
            actionType: 'raise',
            amountBB: 3.5,
            grade: 'blunder',
            evBB: -0.55,
            gtoFrequency: 0,
            explanation: 'Larger opens with a trashy offsuit broadway only inflate the pot with a hand you do not want to play.',
          },
          {
            id: 'pf01-c4',
            label: 'Call 1.0bb (limp)',
            shortLabel: 'Limp',
            actionType: 'call',
            amountBB: 1.0,
            grade: 'blunder',
            evBB: -0.7,
            gtoFrequency: 0,
            explanation: 'Open-limping UTG with KJo is dominated strategy — raise or fold only.',
          },
        ],
      },
    ],
    showdownSummary:
      'Correct fold. At 100bb 6-max, UTG opens a tight value-heavy range; KJo belongs in the muck, not the pot.',
  },

  // --------------------------------------------------------------------------
  // PF-02: UTG suited broadway — open
  // --------------------------------------------------------------------------
  {
    id: 'preflop-02-utg-ats-open',
    title: 'UTG Suited Ace',
    subtitle: '6-max cash · open or fold',
    difficulty: 'Beginner',
    rating: 1250,
    format: 'cash-6max',
    themes: ['Preflop Ranges'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'UTG',
    heroCards: [
      { rank: 'A', suit: 's' },
      { rank: 'T', suit: 's' },
    ],
    seats: seats6max('UTG'),
    preflopAndPriorHistory: [],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 1.5,
        toCallBB: 1.0,
        heroStackBB: 100,
        villainStackBB: 100,
        villainPosition: 'BB',
        prompt: 'Folds to you UTG. What\'s your move?',
        priorActionsThisStreet: [],
        choices: [
          {
            id: 'pf02-c1',
            label: 'Raise to 2.5bb',
            shortLabel: 'Open 2.5x',
            actionType: 'raise',
            amountBB: 2.5,
            grade: 'best',
            evBB: 0.55,
            gtoFrequency: 100,
            explanation:
              'ATs is a standard UTG open: high playability, nut flush potential, and solid equity when called or 3-bet.',
          },
          {
            id: 'pf02-c2',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'mistake',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding ATs UTG is too tight — you leave real EV on the table versus blinds and callers.',
          },
          {
            id: 'pf02-c3',
            label: 'Raise to 4.0bb',
            shortLabel: 'Open 4x',
            actionType: 'raise',
            amountBB: 4.0,
            grade: 'inaccuracy',
            evBB: 0.35,
            gtoFrequency: 0,
            explanation: 'Still an open, but 4x is oversized for 100bb cash and builds pots you do not need this large.',
          },
          {
            id: 'pf02-c4',
            label: 'Call 1.0bb (limp)',
            shortLabel: 'Limp',
            actionType: 'call',
            amountBB: 1.0,
            grade: 'blunder',
            evBB: -0.2,
            gtoFrequency: 0,
            explanation: 'Never open-limp ATs — raise for initiative or (rarely) fold.',
          },
        ],
      },
    ],
    showdownSummary: 'Standard UTG open with ATs. Suited broadway aces are core early-position opens at 100bb.',
  },

  // --------------------------------------------------------------------------
  // PF-03: Button open — speculative suited connector
  // --------------------------------------------------------------------------
  {
    id: 'preflop-03-btn-76s-open',
    title: 'Button First In',
    subtitle: '6-max cash · steal or fold',
    difficulty: 'Beginner',
    rating: 1100,
    format: 'cash-6max',
    themes: ['Preflop Ranges'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'BTN',
    heroCards: [
      { rank: '7', suit: 'h' },
      { rank: '6', suit: 'h' },
    ],
    seats: seats6max('BTN'),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 1.5 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 1.5,
        toCallBB: 1.0,
        heroStackBB: 100,
        villainStackBB: 100,
        villainPosition: 'BB',
        prompt: 'UTG, MP, and CO fold. Action on you (BTN). What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 1.5 },
        ],
        choices: [
          {
            id: 'pf03-c1',
            label: 'Raise to 2.5bb',
            shortLabel: 'Open 2.5x',
            actionType: 'raise',
            amountBB: 2.5,
            grade: 'best',
            evBB: 0.4,
            gtoFrequency: 85,
            explanation:
              '76s is a clear button steal. Position + suited connectivity make this a high-frequency open versus the blinds.',
          },
          {
            id: 'pf03-c2',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'mistake',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding 76s on the button is far too tight — you print by attacking the blinds here.',
          },
          {
            id: 'pf03-c3',
            label: 'Call 1.0bb (limp)',
            shortLabel: 'Limp',
            actionType: 'call',
            amountBB: 1.0,
            grade: 'blunder',
            evBB: -0.15,
            gtoFrequency: 0,
            explanation: 'Limping the button forfeits fold equity and invites SB squeezes / BB raises.',
          },
          {
            id: 'pf03-c4',
            label: 'Raise to 5.0bb',
            shortLabel: 'Open 5x',
            actionType: 'raise',
            amountBB: 5.0,
            grade: 'inaccuracy',
            evBB: 0.15,
            gtoFrequency: 0,
            explanation: 'Still an open, but 5x is a spewy size that prices in dominated calls and bloats the pot.',
          },
        ],
      },
    ],
    showdownSummary: 'Button steal with 76s is automatic. Wide opens from the button are a core 6-max leak-fixer.',
  },

  // --------------------------------------------------------------------------
  // PF-04: BTN vs CO open — 3-bet AQo
  // --------------------------------------------------------------------------
  {
    id: 'preflop-04-btn-aqo-3bet',
    title: 'BTN vs CO Open',
    subtitle: '6-max cash · 3-bet or flat',
    difficulty: 'Intermediate',
    rating: 1450,
    format: 'cash-6max',
    themes: ['Preflop Ranges', '3-Bet Pots'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'BTN',
    heroCards: [
      { rank: 'A', suit: 'h' },
      { rank: 'Q', suit: 'd' },
    ],
    seats: seats6max('BTN', { villainPosition: 'CO', openerBetBB: 2.5 }),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'CO', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 4.0,
        toCallBB: 2.5,
        heroStackBB: 100,
        villainStackBB: 97.5,
        villainPosition: 'CO',
        prompt: 'CO opens to 2.5bb. Action on you (BTN). What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'CO', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
        ],
        choices: [
          {
            id: 'pf04-c1',
            label: '3-Bet to 7.5bb',
            shortLabel: '3-Bet 7.5',
            actionType: 'raise',
            amountBB: 7.5,
            grade: 'best',
            evBB: 1.1,
            gtoFrequency: 75,
            explanation:
              'AQo is a high-frequency BTN 3-bet vs CO. You isolate, deny flats from blinds, and play a strong range IP.',
          },
          {
            id: 'pf04-c2',
            label: 'Call 2.5bb',
            shortLabel: 'Call',
            actionType: 'call',
            amountBB: 2.5,
            grade: 'good',
            evBB: 0.85,
            gtoFrequency: 25,
            explanation:
              'Flatting is a lower-frequency mix, but inviting blinds in with AQo is usually worse than 3-betting.',
          },
          {
            id: 'pf04-c3',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'blunder',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding AQo on the button vs a CO open is a massive leak.',
          },
          {
            id: 'pf04-c4',
            label: '3-Bet to 12.0bb',
            shortLabel: '3-Bet 12',
            actionType: 'raise',
            amountBB: 12.0,
            grade: 'inaccuracy',
            evBB: 0.7,
            gtoFrequency: 0,
            explanation: 'Directionally right, but ~5x the open is oversized and folds out too much of CO’s continuing range.',
          },
        ],
      },
    ],
    showdownSummary:
      'BTN 3-bets AQo vs CO. Prefer isolating with value rather than flatting and playing multiway OOP after blinds enter.',
  },

  // --------------------------------------------------------------------------
  // PF-05: BB vs BTN steal — fold weak offsuit
  // --------------------------------------------------------------------------
  {
    id: 'preflop-05-bb-k9o-fold',
    title: 'BB vs Button Steal',
    subtitle: '6-max cash · defend or fold',
    difficulty: 'Beginner',
    rating: 1300,
    format: 'cash-6max',
    themes: ['Preflop Ranges'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'BB',
    heroCards: [
      { rank: 'K', suit: 'c' },
      { rank: '9', suit: 'd' },
    ],
    seats: seats6max('BB', { villainPosition: 'BTN', openerBetBB: 2.5 }),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'BTN', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 4.0 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 4.0,
        toCallBB: 1.5,
        heroStackBB: 99,
        villainStackBB: 97.5,
        villainPosition: 'BTN',
        prompt: 'BTN opens to 2.5bb, SB folds. Action on you (BB). What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'BTN', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 4.0 },
        ],
        choices: [
          {
            id: 'pf05-c1',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'best',
            evBB: 0.0,
            gtoFrequency: 70,
            explanation:
              'K9o is a common BB over-defend. Dominated by Kx in BTN’s range and plays poorly OOP — folding is the main line.',
          },
          {
            id: 'pf05-c2',
            label: 'Call 1.5bb',
            shortLabel: 'Call',
            actionType: 'call',
            amountBB: 1.5,
            grade: 'inaccuracy',
            evBB: -0.15,
            gtoFrequency: 25,
            explanation: 'Some solvers mix a small defend frequency, but most of your EV comes from folding this trashy offsuit king.',
          },
          {
            id: 'pf05-c3',
            label: '3-Bet to 11.0bb',
            shortLabel: '3-Bet',
            actionType: 'raise',
            amountBB: 11.0,
            grade: 'mistake',
            evBB: -0.45,
            gtoFrequency: 5,
            explanation: '3-betting K9o as a bluff is too thin — you get called/4-bet by better kings and face tough flops.',
          },
          {
            id: 'pf05-c4',
            label: 'All-In (99bb)',
            shortLabel: 'All-In',
            actionType: 'all-in',
            amountBB: 99,
            grade: 'blunder',
            evBB: -8.0,
            gtoFrequency: 0,
            explanation: 'Jam-or-fold with K9o for 100bb is pure spew.',
          },
        ],
      },
    ],
    showdownSummary:
      'Folding K9o in the BB vs a button open plugs a classic leak — price is good, hand quality is not.',
  },

  // --------------------------------------------------------------------------
  // PF-06: BB vs BTN — defend suited connector
  // --------------------------------------------------------------------------
  {
    id: 'preflop-06-bb-87s-defend',
    title: 'BB Suited Defend',
    subtitle: '6-max cash · defend or fold',
    difficulty: 'Beginner',
    rating: 1250,
    format: 'cash-6max',
    themes: ['Preflop Ranges'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'BB',
    heroCards: [
      { rank: '8', suit: 's' },
      { rank: '7', suit: 's' },
    ],
    seats: seats6max('BB', { villainPosition: 'BTN', openerBetBB: 2.5 }),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'BTN', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 4.0 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 4.0,
        toCallBB: 1.5,
        heroStackBB: 99,
        villainStackBB: 97.5,
        villainPosition: 'BTN',
        prompt: 'BTN opens to 2.5bb, SB folds. Action on you (BB). What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'BTN', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 4.0 },
        ],
        choices: [
          {
            id: 'pf06-c1',
            label: 'Call 1.5bb',
            shortLabel: 'Call',
            actionType: 'call',
            amountBB: 1.5,
            grade: 'best',
            evBB: 0.25,
            gtoFrequency: 80,
            explanation:
              '87s is a high-priority BB defend: great price (1.5 into 4), suited connectivity, and strong realization vs BTN c-bets.',
          },
          {
            id: 'pf06-c2',
            label: '3-Bet to 10.0bb',
            shortLabel: '3-Bet',
            actionType: 'raise',
            amountBB: 10.0,
            grade: 'good',
            evBB: 0.15,
            gtoFrequency: 15,
            explanation: 'Occasional 3-bet bluffs with suited connectors are fine, but flatting is the primary strategy.',
          },
          {
            id: 'pf06-c3',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'mistake',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding 87s getting ~2.7:1 from the BB is too tight versus a button steal.',
          },
          {
            id: 'pf06-c4',
            label: 'All-In (99bb)',
            shortLabel: 'All-In',
            actionType: 'all-in',
            amountBB: 99,
            grade: 'blunder',
            evBB: -12.0,
            gtoFrequency: 0,
            explanation: 'Never jam 87s for 100bb as a preflop bluff.',
          },
        ],
      },
    ],
    showdownSummary: 'Calling 87s in the BB vs BTN is a staple defend — suited connectors thrive at this price.',
  },

  // --------------------------------------------------------------------------
  // PF-07: BB vs UTG — 3-bet AJs
  // --------------------------------------------------------------------------
  {
    id: 'preflop-07-bb-ajs-3bet',
    title: 'BB vs UTG Open',
    subtitle: '6-max cash · 3-bet value',
    difficulty: 'Intermediate',
    rating: 1500,
    format: 'cash-6max',
    themes: ['Preflop Ranges', '3-Bet Pots'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'BB',
    heroCards: [
      { rank: 'A', suit: 'd' },
      { rank: 'J', suit: 'd' },
    ],
    seats: seats6max('BB', { villainPosition: 'UTG', openerBetBB: 2.5 }),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'BTN', action: 'Folds', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 4.0 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 4.0,
        toCallBB: 1.5,
        heroStackBB: 99,
        villainStackBB: 97.5,
        villainPosition: 'UTG',
        prompt: 'UTG opens to 2.5bb; folds to you in the BB. What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'UTG', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'BTN', action: 'Folds', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 4.0 },
        ],
        choices: [
          {
            id: 'pf07-c1',
            label: '3-Bet to 11.0bb',
            shortLabel: '3-Bet 11',
            actionType: 'raise',
            amountBB: 11.0,
            grade: 'best',
            evBB: 0.9,
            gtoFrequency: 65,
            explanation:
              'AJs is a strong BB 3-bet vs UTG: value against their continuing range and protects your 3-bet range construction.',
          },
          {
            id: 'pf07-c2',
            label: 'Call 1.5bb',
            shortLabel: 'Call',
            actionType: 'call',
            amountBB: 1.5,
            grade: 'good',
            evBB: 0.7,
            gtoFrequency: 35,
            explanation: 'Flatting AJs is a valid mix, but 3-betting captures more fold equity and initiative OOP.',
          },
          {
            id: 'pf07-c3',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'blunder',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding AJs to a single UTG open is far too tight.',
          },
          {
            id: 'pf07-c4',
            label: '3-Bet to 18.0bb',
            shortLabel: '3-Bet 18',
            actionType: 'raise',
            amountBB: 18.0,
            grade: 'inaccuracy',
            evBB: 0.5,
            gtoFrequency: 0,
            explanation: 'Huge sizing folds out too many worse hands and builds a pot you will often play OOP.',
          },
        ],
      },
    ],
    showdownSummary: '3-betting AJs from the BB vs UTG is a core value raise in modern 6-max ranges.',
  },

  // --------------------------------------------------------------------------
  // PF-08: BTN squeeze vs open + call
  // --------------------------------------------------------------------------
  {
    id: 'preflop-08-btn-ako-squeeze',
    title: 'BTN Squeeze Spot',
    subtitle: '6-max cash · squeeze or flat',
    difficulty: 'Advanced',
    rating: 1650,
    format: 'cash-6max',
    themes: ['Preflop Ranges', '3-Bet Pots'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'BTN',
    heroCards: [
      { rank: 'A', suit: 's' },
      { rank: 'K', suit: 'h' },
    ],
    seats: seats6max('BTN', { villainPosition: 'MP', openerBetBB: 2.5 }),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
      { street: 'preflop', actor: 'CO', action: 'Calls 2.5bb', potAfterBB: 6.5 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 6.5,
        toCallBB: 2.5,
        heroStackBB: 100,
        villainStackBB: 97.5,
        villainPosition: 'MP',
        prompt: 'MP opens to 2.5bb, CO calls. Action on you (BTN). What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'MP', action: 'Raises to 2.5bb', potAfterBB: 4.0 },
          { street: 'preflop', actor: 'CO', action: 'Calls 2.5bb', potAfterBB: 6.5 },
        ],
        choices: [
          {
            id: 'pf08-c1',
            label: '3-Bet to 11.0bb',
            shortLabel: 'Squeeze 11',
            actionType: 'raise',
            amountBB: 11.0,
            grade: 'best',
            evBB: 2.2,
            gtoFrequency: 90,
            explanation:
              'AKo is a premium squeeze. Dead money from the cold-call, initiative, and a hand that dominates much of MP/CO’s ranges.',
          },
          {
            id: 'pf08-c2',
            label: 'Call 2.5bb',
            shortLabel: 'Call',
            actionType: 'call',
            amountBB: 2.5,
            grade: 'inaccuracy',
            evBB: 1.1,
            gtoFrequency: 10,
            explanation: 'Flatting AKo multiway throws away squeeze EV and invites blinds to enter cheaply.',
          },
          {
            id: 'pf08-c3',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'blunder',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding AKo here is unthinkable.',
          },
          {
            id: 'pf08-c4',
            label: 'All-In (100bb)',
            shortLabel: 'All-In',
            actionType: 'all-in',
            amountBB: 100,
            grade: 'mistake',
            evBB: 0.4,
            gtoFrequency: 0,
            explanation: 'Overkill at 100bb — a standard squeeze size keeps worse hands in and avoids cooling off when called.',
          },
        ],
      },
    ],
    showdownSummary: 'Squeezing AKo over an open + call is high EV — take the dead money and isolate.',
  },

  // --------------------------------------------------------------------------
  // PF-09: CO open faces BTN 3-bet — fold speculative
  // --------------------------------------------------------------------------
  {
    id: 'preflop-09-co-jts-fold-vs-3bet',
    title: 'CO vs BTN 3-Bet',
    subtitle: '6-max cash · continue or fold',
    difficulty: 'Intermediate',
    rating: 1550,
    format: 'cash-6max',
    themes: ['Preflop Ranges', '3-Bet Pots'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'CO',
    heroCards: [
      { rank: 'J', suit: 'h' },
      { rank: 'T', suit: 'h' },
    ],
    seats: seats6max('CO', { villainPosition: 'BTN', openerBetBB: 8.5 }).map((s) =>
      s.position === 'CO' ? { ...s, currentBetBB: 2.5, stackBB: 97.5 } : s
    ),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'CO', action: 'Raises to 2.5bb', potAfterBB: 4.0, isHero: true },
      { street: 'preflop', actor: 'BTN', action: '3-Bets to 8.5bb', potAfterBB: 12.5 },
      { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 12.5 },
      { street: 'preflop', actor: 'BB', action: 'Folds', potAfterBB: 12.5 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 12.5,
        toCallBB: 6.0,
        heroStackBB: 97.5,
        villainStackBB: 91.5,
        villainPosition: 'BTN',
        prompt: 'You open CO to 2.5bb. BTN 3-bets to 8.5bb; blinds fold. Action back on you. What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'CO', action: 'Raises to 2.5bb', potAfterBB: 4.0, isHero: true },
          { street: 'preflop', actor: 'BTN', action: '3-Bets to 8.5bb', potAfterBB: 12.5 },
          { street: 'preflop', actor: 'SB', action: 'Folds', potAfterBB: 12.5 },
          { street: 'preflop', actor: 'BB', action: 'Folds', potAfterBB: 12.5 },
        ],
        choices: [
          {
            id: 'pf09-c1',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'best',
            evBB: 0.0,
            gtoFrequency: 85,
            explanation:
              'JTs is a fine open but a clear fold vs a BTN 3-bet at 100bb. Calling OOP in a 3-bet pot with a non-premium is −EV.',
          },
          {
            id: 'pf09-c2',
            label: 'Call 6.0bb',
            shortLabel: 'Call',
            actionType: 'call',
            amountBB: 6.0,
            grade: 'mistake',
            evBB: -0.6,
            gtoFrequency: 10,
            explanation: 'Flatting JTs vs a button 3-bet leads to tough flops and dominated equity realization.',
          },
          {
            id: 'pf09-c3',
            label: '4-Bet to 20.0bb',
            shortLabel: '4-Bet',
            actionType: 'raise',
            amountBB: 20.0,
            grade: 'inaccuracy',
            evBB: -0.35,
            gtoFrequency: 5,
            explanation: 'Rare bluff 4-bets exist, but JTs is not a high-priority blocker bluff versus BTN’s value-heavy 3-bets.',
          },
          {
            id: 'pf09-c4',
            label: 'All-In (97.5bb)',
            shortLabel: 'All-In',
            actionType: 'all-in',
            amountBB: 97.5,
            grade: 'blunder',
            evBB: -4.5,
            gtoFrequency: 0,
            explanation: 'Jam-4-betting JTs for 100bb gets called by better and folds out the hands you wanted to bluff.',
          },
        ],
      },
    ],
    showdownSummary:
      'Folding JTs to a BTN 3-bet is disciplined. Speculative opens do not automatically continue versus aggression.',
  },

  // --------------------------------------------------------------------------
  // PF-10: SB vs folds — open suited ace
  // --------------------------------------------------------------------------
  {
    id: 'preflop-10-sb-a4s-open',
    title: 'SB First In',
    subtitle: '6-max cash · open or fold',
    difficulty: 'Intermediate',
    rating: 1400,
    format: 'cash-6max',
    themes: ['Preflop Ranges'],
    blindsText: '100bb Cash ($1/$2)',
    tableSize: 6,
    heroPosition: 'SB',
    heroCards: [
      { rank: 'A', suit: 'c' },
      { rank: '4', suit: 'c' },
    ],
    seats: seats6max('SB'),
    preflopAndPriorHistory: [
      { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 1.5 },
      { street: 'preflop', actor: 'BTN', action: 'Folds', potAfterBB: 1.5 },
    ],
    steps: [
      {
        stepIndex: 0,
        street: 'preflop',
        board: [],
        potBB: 1.5,
        toCallBB: 0.5,
        heroStackBB: 100,
        villainStackBB: 100,
        villainPosition: 'BB',
        prompt: 'Folds to you in the SB. What\'s your move?',
        priorActionsThisStreet: [
          { street: 'preflop', actor: 'UTG', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'MP', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'CO', action: 'Folds', potAfterBB: 1.5 },
          { street: 'preflop', actor: 'BTN', action: 'Folds', potAfterBB: 1.5 },
        ],
        choices: [
          {
            id: 'pf10-c1',
            label: 'Raise to 3.0bb',
            shortLabel: 'Open 3x',
            actionType: 'raise',
            amountBB: 3.0,
            grade: 'best',
            evBB: 0.35,
            gtoFrequency: 80,
            explanation:
              'A4s is a standard SB open vs BB. Suited ace blockers + playability make this a raise, not a limp or fold.',
          },
          {
            id: 'pf10-c2',
            label: 'Call 0.5bb (complete)',
            shortLabel: 'Complete',
            actionType: 'call',
            amountBB: 0.5,
            grade: 'mistake',
            evBB: -0.05,
            gtoFrequency: 5,
            explanation: 'Completing turns a raise-or-fold hand into a dominated limped pot and invites BB aggression.',
          },
          {
            id: 'pf10-c3',
            label: 'Fold',
            shortLabel: 'Fold',
            actionType: 'fold',
            grade: 'inaccuracy',
            evBB: 0.0,
            gtoFrequency: 0,
            explanation: 'Folding A4s SB vs BB is too tight — you want to attack this pot.',
          },
          {
            id: 'pf10-c4',
            label: 'Raise to 5.0bb',
            shortLabel: 'Open 5x',
            actionType: 'raise',
            amountBB: 5.0,
            grade: 'good',
            evBB: 0.25,
            gtoFrequency: 15,
            explanation: 'Larger SB opens are used by some regs; 3x is cleaner default sizing at 100bb.',
          },
        ],
      },
    ],
    showdownSummary: 'Opening A4s from the SB is standard. Raise for initiative; avoid completing speculative suited aces.',
  },
];

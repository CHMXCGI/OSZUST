export type Suit = 'Pik' | 'Kier' | 'Trefl' | 'Karo';
export type Rank = '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export interface Player {
  id: number;
  name: string;
  hand: Card[];
  isHuman: boolean;
}

export type GamePhase = 'MENU' | 'PLAYING' | 'GAME_OVER';

export interface LastPlay {
  playerId: number;
  declaredRank: Rank;
  declaredCount: number;
  actualCards: Card[];
  isChallengeable: boolean;
}
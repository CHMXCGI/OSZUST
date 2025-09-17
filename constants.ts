import { Rank, Suit } from './types';

export const RANKS: Rank[] = ['8', '9', '10', 'J', 'Q', 'K', 'A'];
export const SUITS: Suit[] = ['Pik', 'Kier', 'Trefl', 'Karo'];

export const RANK_ORDER: { [key in Rank]: number } = {
  '8': 1, '9': 2, '10': 3, 'J': 4, 'Q': 5, 'K': 6, 'A': 7
};
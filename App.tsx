
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Rank, Suit, Card, Player, GamePhase, LastPlay } from './types';
import { RANKS, SUITS, RANK_ORDER } from './constants';

// HELPER FUNCTIONS
const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank, id: `${rank}-${suit}` });
    });
  });
  return deck;
};

const shuffleDeck = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


// UI COMPONENTS (Defined outside the main App component)

interface CardComponentProps {
  card: Card;
  isFaceDown?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

const CardComponent: React.FC<CardComponentProps> = ({ card, isFaceDown = false, isSelected = false, onClick, className = '' }) => {
  const suitSymbols: { [key in Suit]: string } = { Kier: '♥', Karo: '♦', Pik: '♠', Trefl: '♣' };
  const suitColors: { [key in Suit]: string } = { Kier: 'text-red-500', Karo: 'text-red-500', Pik: 'text-black', Trefl: 'text-black' };

  if (isFaceDown) {
    return (
      <div className={`w-20 h-28 bg-blue-900/50 border border-blue-700/50 rounded-lg flex items-center justify-center shadow-lg p-1 ${className}`}>
         <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-700 via-indigo-700 to-blue-600 flex items-center justify-center">
             <div className="w-1/2 h-1/2 border-2 border-blue-500/30 rounded-full blur-sm"></div>
         </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`w-20 h-28 bg-white border rounded-lg flex flex-col justify-between p-2 shadow-lg transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-1 ${isSelected ? '-translate-y-4 scale-105 border-white border-2 shadow-[0_0_25px_rgba(255,255,255,0.6)]' : 'border-gray-300/50 hover:border-gray-400'} ${className}`}
    >
      <div className="text-left">
        <div className={`text-2xl font-extrabold ${suitColors[card.suit]}`}>{card.rank}</div>
        <div className={`text-xl ${suitColors[card.suit]}`}>{suitSymbols[card.suit]}</div>
      </div>
      <div className={`text-2xl font-extrabold self-end transform rotate-180 ${suitColors[card.suit]}`}>
        {card.rank}
      </div>
    </div>
  );
};


interface AnimatedCardProps {
    card: Card;
    from: 'player' | 'ai';
    index: number;
    isFaceUp?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ card, from, index, isFaceUp = false }) => {
    const [style, setStyle] = useState<React.CSSProperties>({
        position: 'fixed',
        left: '50%',
        bottom: from === 'player' ? '25%' : 'auto',
        top: from === 'player' ? 'auto' : '25%',
        transform: `translateX(-50%) rotate(${Math.random() * 10 - 5}deg) scale(0.8)`,
        transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        zIndex: 100 + index,
        opacity: 0.5,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setStyle(prev => ({
                ...prev,
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) rotate(${Math.random() * 20 - 10}deg)`,
                opacity: 1,
            }));
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    return <div style={style}><CardComponent card={card} isFaceDown={!isFaceUp} /></div>;
};


interface DeclaredCardDisplayProps {
    rank: Rank;
    className?: string;
}

const DeclaredCardDisplay: React.FC<DeclaredCardDisplayProps> = ({ rank, className = '' }) => (
    <div className={`w-20 h-28 bg-blue-600/10 backdrop-blur-md border-2 border-dashed border-blue-700/50 rounded-lg flex items-center justify-center shadow-lg ${className}`}>
        <span className="text-5xl font-extrabold text-blue-300 opacity-80">{rank}</span>
    </div>
);


interface PlayerHandProps {
  player: Player;
  selectedCards: Card[];
  onCardSelect: (card: Card) => void;
  isPlayerTurn: boolean;
  lastCardDeclarerId: number | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ player, selectedCards, onCardSelect, isPlayerTurn, lastCardDeclarerId }) => {
  const sortedHand = useMemo(() => {
    return [...player.hand].sort((a, b) => RANK_ORDER[a.rank] - RANK_ORDER[b.rank]);
  }, [player.hand]);
  
  return (
    <div className={`relative flex flex-col items-center p-4 rounded-[28px] transition-all duration-500 bg-blue-600/20 backdrop-blur-xl border border-blue-400/30 ${isPlayerTurn ? 'shadow-[0_0_40px_rgba(96,165,250,0.5)] bg-blue-600/30' : ''}`}>
        <div className="flex justify-center items-end -space-x-6 w-full px-8">
          {sortedHand.map(card => (
            <CardComponent
              key={card.id}
              card={card}
              isSelected={selectedCards.some(c => c.id === card.id)}
              onClick={isPlayerTurn ? () => onCardSelect(card) : undefined}
            />
          ))}
        </div>
        <div className="absolute -top-5 bg-gray-900/80 backdrop-blur-lg px-6 py-2 rounded-full border border-white/10 flex items-center gap-4">
            <span className="text-xl font-bold tracking-wider text-gray-200">{player.name}</span>
             {lastCardDeclarerId === player.id && (
                <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse">
                    OSTATNIA KARTA
                </div>
            )}
        </div>
    </div>
  );
};

interface OpponentDisplayProps {
  player: Player;
  isPlayerTurn: boolean;
  lastCardDeclarerId: number | null;
}

const OpponentDisplay: React.FC<OpponentDisplayProps> = ({ player, isPlayerTurn, lastCardDeclarerId }) => {
    return (
        <div className={`relative flex flex-col items-center p-4 rounded-[28px] transition-all duration-500 bg-blue-600/20 backdrop-blur-xl border border-blue-400/30 ${isPlayerTurn ? 'shadow-[0_0_40px_rgba(96,165,250,0.5)] bg-blue-600/30' : ''}`}>
            <div className="absolute -bottom-5 bg-gray-900/80 backdrop-blur-lg px-6 py-2 rounded-full border border-white/10 flex items-center gap-4">
                <span className="text-xl font-bold tracking-wider text-gray-200">{player.name}</span>
                {lastCardDeclarerId === player.id && (
                    <div className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse">
                        OSTATNIA KARTA
                    </div>
                )}
            </div>
            <div className="flex justify-center items-end -space-x-6 w-full px-8">
                {player.hand.map((_, index) => (
                    <CardComponent key={index} card={{rank: '8', suit: 'Pik', id: `back-${index}`}} isFaceDown={true} />
                ))}
            </div>
        </div>
    );
};


interface ActionButtonProps {
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, disabled = false, children, className = '', variant = 'primary' }) => {
    const baseClasses = 'px-6 py-3 text-lg font-bold rounded-2xl transition-all duration-200 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider shadow-lg transform hover:-translate-y-0.5';
    
    const variantClasses = {
        primary: 'bg-white text-black enabled:hover:bg-gray-300',
        secondary: 'bg-white/20 text-white enabled:hover:bg-white/30',
    };
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        >
            {children}
        </button>
    );
};


interface DeclareRankModalProps {
    onDeclare: (rank: Rank) => void;
    onClose: () => void;
    minRankOrder: number;
    selectedCards: Card[];
}
  
const DeclareRankModal: React.FC<DeclareRankModalProps> = ({ onDeclare, onClose, minRankOrder, selectedCards }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-gray-900/60 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/10">
                <div className="mb-6">
                    <p className="text-center text-gray-400 mb-2 text-sm uppercase font-semibold tracking-wider">Zagrywane Karty</p>
                    <div className="flex justify-center items-center space-x-1">
                        {selectedCards.map(card => <CardComponent key={card.id} card={card} className="w-16 h-24" />)}
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-center mb-6 text-gray-100">Zadeklaruj Rangę</h3>
                <div className="grid grid-cols-4 gap-4">
                {RANKS.map(rank => {
                    const isDisabled = minRankOrder > 0 && RANK_ORDER[rank] < minRankOrder;
                    return (
                        <button
                            key={rank}
                            onClick={() => onDeclare(rank)}
                            disabled={isDisabled}
                            className={`w-20 h-28 rounded-lg flex items-center justify-center transition-all shadow-md transform hover:-translate-y-1
                                ${isDisabled 
                                    ? 'bg-black/20 border border-white/10 opacity-40 cursor-not-allowed' 
                                    : 'bg-white/20 border border-white/20 hover:bg-white/30 hover:border-blue-500'
                                }`}
                        >
                            <span className={`text-5xl font-extrabold ${isDisabled ? 'text-gray-600' : 'text-gray-300'}`}>{rank}</span>
                        </button>
                    )
                })}
                </div>
                <button onClick={onClose} className="mt-8 w-full bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg font-semibold uppercase tracking-wider">Anuluj</button>
            </div>
        </div>
    );
};

interface GameOverBannerProps {
    winnerName: string;
    onRestart: () => void;
}

const GameOverBanner: React.FC<GameOverBannerProps> = ({ winnerName, onRestart }) => (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/10 text-center z-50">
        <h2 className="text-3xl font-bold text-white mb-2">Koniec Gry!</h2>
        <p className="text-xl mb-4 text-gray-300">Wygrywa <span className="font-bold text-white">{winnerName}</span>!</p>
        <ActionButton onClick={onRestart} variant="primary">
            Zagraj Ponownie
        </ActionButton>
    </div>
);

interface RevealedBluffDisplayProps {
    cards: Card[];
}

const RevealedBluffDisplay: React.FC<RevealedBluffDisplayProps> = ({ cards }) => (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[150%] bg-gray-900/90 backdrop-blur-lg rounded-xl p-4 shadow-2xl border border-orange-500 text-center z-40">
        <h2 className="text-xl font-bold text-orange-400 mb-1">Ujawniony Blef!</h2>
        <div className="flex justify-center items-center space-x-1">
            {cards.map(card => <CardComponent key={card.id} card={card} className="w-16 h-24" />)}
        </div>
    </div>
);

interface FinalChallengeModalProps {
    onChallenge: () => void;
    onConcede: () => void;
    opponentName: string;
}

const FinalChallengeModal: React.FC<FinalChallengeModalProps> = ({ onChallenge, onConcede, opponentName }) => (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex justify-center items-center z-50">
        <div className="bg-gray-900/80 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/10 text-center">
            <h2 className="text-4xl font-extrabold text-white mb-4">Ostatnia Karta!</h2>
            <p className="text-xl mb-8 text-gray-300">{opponentName} zagrał ostatnią kartę. Sprawdzasz?</p>
            <div className="flex justify-center gap-4">
                <ActionButton onClick={onChallenge}>Sprawdzam!</ActionButton>
                <ActionButton onClick={onConcede} variant="secondary">Poddaję się</ActionButton>
            </div>
        </div>
    </div>
);


// MAIN APP COMPONENT
export default function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('MENU');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [lastPlay, setLastPlay] = useState<LastPlay | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isDeclareModalOpen, setDeclareModalOpen] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [lastCardDeclared, setLastCardDeclared] = useState(false);
  const [penaltyOpportunity, setPenaltyOpportunity] = useState<{ forPlayerId: number, byPlayerId: number } | null>(null);
  const [revealedBluff, setRevealedBluff] = useState<{ cards: Card[] } | null>(null);
  const [finalPlay, setFinalPlay] = useState<LastPlay | null>(null);
  const [animatingCards, setAnimatingCards] = useState<{ cards: Card[]; from: 'player' | 'ai'; key: number; isFaceUp: boolean; } | null>(null);
  const [visibleDeclaration, setVisibleDeclaration] = useState<Rank | null>(null);
  const [isOpeningMoveAvailable, setOpeningMoveAvailable] = useState(false);
  const [lastCardDeclarerId, setLastCardDeclarerId] = useState<number | null>(null);

  const penaltyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const humanPlayer = players.find(p => p.isHuman);
  const aiPlayer = players.find(p => !p.isHuman);
  const currentPlayer = players[currentPlayerIndex];
  const minRankOrder = useMemo(() => (lastPlay ? RANK_ORDER[lastPlay.declaredRank] : 0), [lastPlay]);

  const addLog = useCallback((message: string) => {
    setGameLog(prev => [message, ...prev].slice(0, 100));
  }, []);
  
  const resetGame = useCallback(() => {
    if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setDiscardPile([]);
    setLastPlay(null);
    setGameLog([]);
    setSelectedCards([]);
    setDeclareModalOpen(false);
    setWinner(null);
    setLastCardDeclared(false);
    setPenaltyOpportunity(null);
    setRevealedBluff(null);
    setFinalPlay(null);
    setAnimatingCards(null);
    setVisibleDeclaration(null);
    setOpeningMoveAvailable(false);
    setLastCardDeclarerId(null);
  }, []);

  const startGame = useCallback(() => {
    resetGame();
    const shuffledDeck = shuffleDeck(createDeck());
    const newPlayers: Player[] = [
      { id: 1, name: 'Gracz', hand: [], isHuman: true },
      { id: 2, name: 'AI', hand: [], isHuman: false },
    ];

    while(shuffledDeck.length > 0) {
        newPlayers[0].hand.push(shuffledDeck.pop()!);
        if (shuffledDeck.length > 0) {
            newPlayers[1].hand.push(shuffledDeck.pop()!);
        }
    }
    
    const starterCardId = '8-Kier';
    const starterPlayerIndex = newPlayers.findIndex(p => p.hand.some(c => c.id === starterCardId));
    
    if (starterPlayerIndex === -1) { 
        startGame();
        return;
    }
    
    setPlayers(newPlayers);
    setCurrentPlayerIndex(starterPlayerIndex);
    setOpeningMoveAvailable(true);
    setGamePhase('PLAYING');

    const startingPlayerName = newPlayers[starterPlayerIndex].name;
    const initialLogs = [
        "Nowa Gra Rozpoczęta.",
        `Gracz ${startingPlayerName} ma 8 Kier i rozpoczyna.`,
    ];
    initialLogs.forEach(log => addLog(log));
  }, [resetGame, addLog]);

  const nextTurn = useCallback(() => {
    setCurrentPlayerIndex(prev => (prev + 1) % players.length);
  }, [players.length]);
  
  const handleReportNoDeclaration = useCallback(() => {
    if (!penaltyOpportunity) return;
    if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);

    const { forPlayerId, byPlayerId } = penaltyOpportunity;
    const penalizedPlayer = players.find(p => p.id === byPlayerId)!;
    const reporter = players.find(p => p.id === forPlayerId)!;

    addLog(`${reporter.name} zgłasza brak deklaracji! ${penalizedPlayer.name} bierze 3 karty kary.`);
    
    const hasPermanent8 = discardPile.length > 0 && discardPile[0].id === '8-Kier';
    const playablePile = hasPermanent8 ? discardPile.slice(1) : discardPile;
    const cardsToTake = playablePile.slice(-3);
    const remainingPlayablePile = playablePile.slice(0, playablePile.length - cardsToTake.length);
    const pileToKeep = hasPermanent8 ? [discardPile[0]] : [];

    setPlayers(prev => prev.map(p => p.id === penalizedPlayer.id ? { ...p, hand: [...p.hand, ...cardsToTake] } : p));
    setDiscardPile([...pileToKeep, ...remainingPlayablePile]);
    
    setPenaltyOpportunity(null);
    setCurrentPlayerIndex(players.findIndex(p => p.id === reporter.id));
    addLog(`Tura gracza ${reporter.name}.`);
  }, [addLog, discardPile, penaltyOpportunity, players]);

  const initiatePlay = useCallback((player: Player, cardsToPlay: Card[], declaredRank: Rank, isChallengeable: boolean) => {
    const isOpening = isOpeningMoveAvailable && cardsToPlay.some(c => c.id === '8-Kier');
    const isUnchallengeableFour = cardsToPlay.length === 4 && new Set(cardsToPlay.map(c => c.rank)).size === 1;

    setLastCardDeclarerId(null);

    setPlayers(prev => prev.map(p => p.id === player.id 
      ? { ...p, hand: p.hand.filter(card => !cardsToPlay.some(c => c.id === card.id)) } 
      : p));
    
    setAnimatingCards({
        cards: cardsToPlay,
        from: player.isHuman ? 'player' : 'ai',
        key: Date.now(),
        isFaceUp: isUnchallengeableFour || (isOpening && cardsToPlay.length > 0),
    });

    if(isChallengeable) {
        setVisibleDeclaration(declaredRank);
    }
    
    if (player.isHuman) {
        setSelectedCards([]);
        setDeclareModalOpen(false);
    }
    
    setTimeout(() => {
        setVisibleDeclaration(null);
        setAnimatingCards(null);

        if (isOpening) {
            const starterCard = cardsToPlay.find(c => c.id === '8-Kier')!;
            const otherCards = cardsToPlay.filter(c => c.id !== '8-Kier');
            setDiscardPile([starterCard, ...otherCards]);
            addLog(`${player.name} rozpoczyna grę z 8 Kier.`);
            setOpeningMoveAvailable(false);
        } else {
            setDiscardPile(prev => [...prev, ...cardsToPlay]);
        }
        
        const newLastPlay: LastPlay = {
            playerId: player.id,
            declaredRank,
            declaredCount: cardsToPlay.length,
            actualCards: cardsToPlay,
            isChallengeable,
        };
        setLastPlay(newLastPlay);
        
        const logMsg = isChallengeable 
            ? `${player.name} zagrał ${cardsToPlay.length}x jako "${declaredRank}".`
            : `${player.name} jawnie zagrywa 4x "${declaredRank}".`;
        addLog(logMsg);
        
        const isLastCardMove = player.hand.length - cardsToPlay.length === 1;
        let hasDeclared = false;
        
        if (player.isHuman && lastCardDeclared) hasDeclared = true;
        
        if (lastCardDeclarerId === player.id) hasDeclared = true;


        if (!player.isHuman && isLastCardMove) {
            if (Math.random() < 0.85) { // 85% chance for AI to "remember"
                addLog(`AI deklaruje: OSTATNIA KARTA!`);
                setLastCardDeclarerId(player.id);
                hasDeclared = true;
            } else {
                 addLog(`AI... wydaje się o czymś zapominać.`);
                 hasDeclared = false;
            }
        } else if (player.isHuman && isLastCardMove && hasDeclared) {
            addLog(`${player.name} deklaruje: OSTATNIA KARTA!`);
        }
        
        setLastCardDeclared(false);

        if (isLastCardMove && !hasDeclared) {
            const opponent = players.find(p => p.id !== player.id)!;
            addLog(`${player.name} nie zadeklarował ostatniej karty. Przeciwnik będzie mógł go zgłosić za 3 sekundy.`);
            if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
            penaltyTimerRef.current = setTimeout(() => {
                addLog(`Minął okres ochronny! ${opponent.name} może teraz zgłosić brak deklaracji!`);
                setPenaltyOpportunity({ forPlayerId: opponent.id, byPlayerId: player.id });
            }, 3000);
        }
        
        nextTurn();
    }, 500);
  }, [addLog, lastCardDeclared, nextTurn, players, isOpeningMoveAvailable, lastCardDeclarerId]);

  const clearPendingPenaltyOpportunity = () => {
    if (penaltyOpportunity) {
        if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
        setPenaltyOpportunity(null);
        addLog("Okazja do zgłoszenia kary została zignorowana.");
    }
  };

  const handleCardSelect = useCallback((card: Card) => {
    if (!humanPlayer) return;

    const newSelected = selectedCards.some(c => c.id === card.id)
        ? selectedCards.filter(c => c.id !== card.id)
        : [...selectedCards, card];
    
    setSelectedCards(newSelected);
    
    if (humanPlayer.hand.length - newSelected.length !== 1) {
        setLastCardDeclared(false);
        if (lastCardDeclarerId === humanPlayer.id) setLastCardDeclarerId(null);
    }
  }, [humanPlayer, selectedCards, lastCardDeclarerId]);
  
  const handleLastCardButtonClick = useCallback(() => {
    if (!humanPlayer) return;

    if (penaltyOpportunity && penaltyOpportunity.byPlayerId === humanPlayer.id) {
        if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
        setPenaltyOpportunity(null);
        setLastCardDeclarerId(humanPlayer.id);
        addLog('Gracz w porę zadeklarował ostatnią kartę, unikając kary!');
        return;
    }

    setLastCardDeclared(prev => {
        const isDeclaring = !prev;
        if (isDeclaring) {
            setLastCardDeclarerId(humanPlayer.id);
        } else {
            setLastCardDeclarerId(null);
        }
        return isDeclaring;
    });
  }, [humanPlayer, penaltyOpportunity, addLog]);

  const handlePlayCards = (declaredRank: Rank) => {
    if (!humanPlayer || selectedCards.length === 0) return;
    initiatePlay(humanPlayer, selectedCards, declaredRank, true);
  };

  const handlePlayerPlayAction = () => {
    clearPendingPenaltyOpportunity();
    if (!humanPlayer) return;

    if (isOpeningMoveAvailable) {
        if (selectedCards.some(c => c.id === '8-Kier') && [3, 4].includes(selectedCards.length)) {
            initiatePlay(humanPlayer, selectedCards, '8', true);
            return;
        }
    }

    if (selectedCards.length === 4) {
        const isFourOfAKind = new Set(selectedCards.map(c => c.rank)).size === 1;
        if (isFourOfAKind) {
            const rank = selectedCards[0].rank;
            if (RANK_ORDER[rank] < minRankOrder) return;
            initiatePlay(humanPlayer, selectedCards, rank, false);
            return;
        }
    }

    if ([1, 3].includes(selectedCards.length)) {
      setDeclareModalOpen(true);
    }
  };


  const handleTakeCards = () => {
    clearPendingPenaltyOpportunity();
    if (isOpeningMoveAvailable) return;
    
    const hasPermanent8 = discardPile.length > 0 && discardPile[0].id === '8-Kier';
    const playablePile = hasPermanent8 ? discardPile.slice(1) : discardPile;

    if (!humanPlayer || playablePile.length === 0) return;
    
    const cardsToTake = playablePile.slice(-3);
    const remainingPlayablePile = playablePile.slice(0, playablePile.length - cardsToTake.length);
    const pileToKeep = hasPermanent8 ? [discardPile[0]] : [];


    setPlayers(prev => prev.map(p => p.id === humanPlayer.id ? { ...p, hand: [...p.hand, ...cardsToTake] } : p));
    setDiscardPile([...pileToKeep, ...remainingPlayablePile]);

    addLog(`Gracz pobrał ${cardsToTake.length} kart(y) ze stosu.`);
    nextTurn();
  }
  
  const executeChallenge = (playToChallenge: LastPlay) => {
    const { declaredRank, declaredCount, actualCards, playerId } = playToChallenge;
    const challenger = players.find(p => p.id !== playerId)!;
    const bluffer = players.find(p => p.id === playerId)!;
    
    const fullPile = [...discardPile];
    const hasPermanent8 = fullPile.length > 0 && fullPile[0].id === '8-Kier';
    const permanentCard = hasPermanent8 ? fullPile[0] : null;
    const pileToTake = hasPermanent8 ? fullPile.slice(1) : fullPile;
    const pileToKeep = permanentCard ? [permanentCard] : [];

    addLog(`${challenger.name} mówi "SPRAWDZAM!".`);
  
    const isBluff = actualCards.some(card => card.rank !== declaredRank);
      
    if (isBluff) {
        const actualCardsString = actualCards.map(c => c.rank).join(', ');
        addLog(`To był blef! ${bluffer.name} zagrał: [${actualCardsString}], a nie ${declaredCount}x "${declaredRank}".`);
        setRevealedBluff({ cards: actualCards });
        setTimeout(() => {
            addLog(`${bluffer.name} zabiera stos.`);
            setPlayers(prev => prev.map(p => p.id === bluffer.id ? { ...p, hand: [...p.hand, ...pileToTake] } : p));
            setDiscardPile(pileToKeep);
            setLastPlay(null);
            setRevealedBluff(null);
            setCurrentPlayerIndex(players.findIndex(p => p.id === bluffer.id));
        }, 2500);
    } else {
        addLog(`To nie był blef. ${challenger.name} zabiera stos.`);
        setPlayers(prev => prev.map(p => p.id === challenger.id ? { ...p, hand: [...p.hand, ...pileToTake] } : p));
        setDiscardPile(pileToKeep);
        setLastPlay(null);
        setCurrentPlayerIndex(players.findIndex(p => p.id === challenger.id));
    }
  };

  const handleChallenge = () => {
    clearPendingPenaltyOpportunity();
    if (!lastPlay || !lastPlay.isChallengeable) return;
    executeChallenge(lastPlay);
  };
  
  const handleFinalChallenge = () => {
    if (!finalPlay) return;
    executeChallenge(finalPlay);
    setFinalPlay(null);
  };

  const handleConcedeWin = () => {
    if (!finalPlay) return;
    const winner = players.find(p => p.id === finalPlay.playerId);
    if (winner) {
        setWinner(winner);
        setGamePhase('GAME_OVER');
    }
    setFinalPlay(null);
  };
  
  const aiTurn = useCallback(() => {
    if (!aiPlayer) return;
    
    if (penaltyOpportunity && penaltyOpportunity.byPlayerId === aiPlayer.id) {
       // AI has a chance to correct its mistake
       if (Math.random() < 0.5) { // 50% chance to notice and correct
            if (penaltyTimerRef.current) clearTimeout(penaltyTimerRef.current);
            setPenaltyOpportunity(null);
            setLastCardDeclarerId(aiPlayer.id);
            addLog('AI w ostatniej chwili deklaruje ostatnią kartę!');
            // AI continues its turn after correcting
       }
    }
    
    if (penaltyOpportunity && penaltyOpportunity.forPlayerId === aiPlayer.id) {
        addLog("AI zauważyło brak deklaracji...");
        setTimeout(() => {
            handleReportNoDeclaration();
        }, 1500);
        return;
    }

    if (isOpeningMoveAvailable) {
        const eights = aiPlayer.hand.filter(c => c.rank === '8');
        if (eights.length >= 3) {
            let cardsToPlay = eights.slice(0, eights.length === 4 ? 4 : 3);
            if (Math.random() > 0.8 && aiPlayer.hand.length > cardsToPlay.length) {
                const bluffCard = aiPlayer.hand.find(c => c.rank !== '8' && c.id !== '8-Kier');
                if(bluffCard) cardsToPlay[1] = bluffCard;
            }
            initiatePlay(aiPlayer, cardsToPlay, '8', true);
            return;
        } else {
             const eightOfHearts = aiPlayer.hand.find(c => c.id === '8-Kier')!;
             initiatePlay(aiPlayer, [eightOfHearts], '8', true);
             return;
        }
    }

    if (lastPlay && lastPlay.isChallengeable) {
      const cardsInHandOfDeclaredRank = aiPlayer.hand.filter(c => c.rank === lastPlay.declaredRank).length;
      const totalCardsOfRank = 4;
      if (cardsInHandOfDeclaredRank + lastPlay.declaredCount > totalCardsOfRank) {
        setTimeout(() => handleChallenge(), 1000);
        return;
      }
      
      let challengeChance = 0.05;
      if (lastPlay.declaredCount === 3) challengeChance += 0.4;
      if (lastPlay.declaredCount === 1) challengeChance += 0.1;
      if (['K', 'A'].includes(lastPlay.declaredRank)) challengeChance += 0.15;
      if (players.find(p=>p.id === lastPlay!.playerId)!.hand.length <= 3) challengeChance += 0.2;

      if (Math.random() < challengeChance) {
        setTimeout(() => handleChallenge(), 1000);
        return;
      }
    }
    
    setTimeout(() => {
        const counts: { [key in Rank]?: Card[] } = {};
        aiPlayer.hand.forEach(card => {
            if (!counts[card.rank]) counts[card.rank] = [];
            counts[card.rank]!.push(card);
        });

        const validHonestGroups = Object.values(counts)
            .filter(group => RANK_ORDER[group[0].rank] >= minRankOrder);
        
        const honestFour = validHonestGroups.find(g => g.length === 4);
        
        if (honestFour) {
            initiatePlay(aiPlayer, honestFour, honestFour[0].rank, false);
            return;
        }

        const honestThree = validHonestGroups.find(g => g.length >= 3);
        const honestSingle = validHonestGroups.find(g => g.length >= 1);

        if (honestThree) {
            initiatePlay(aiPlayer, honestThree.slice(0, 3), honestThree[0].rank, true);
            return;
        }
        if (honestSingle) {
            initiatePlay(aiPlayer, [honestSingle[0]], honestSingle[0].rank, true);
            return;
        }

        if (aiPlayer.hand.length > 0) {
            const allCardGroups = Object.values(counts).sort((a,b) => a.length - b.length);
            const cardToBluff = allCardGroups[0][0];
            
            const possibleBluffRanks = RANKS.filter(r => RANK_ORDER[r] >= minRankOrder);
            let declaredRank: Rank | undefined;
            if (possibleBluffRanks.length > 0) {
                const closestRank = possibleBluffRanks.find(r => RANK_ORDER[r] === minRankOrder || RANK_ORDER[r] === minRankOrder + 1);
                declaredRank = closestRank || possibleBluffRanks[0];
            } else {
                 declaredRank = RANKS[RANKS.length - 1];
            }

            initiatePlay(aiPlayer, [cardToBluff], declaredRank, true);

        } else {
            const hasPermanent8 = discardPile.length > 0 && discardPile[0].id === '8-Kier';
            const playablePile = hasPermanent8 ? discardPile.slice(1) : discardPile;
            if (playablePile.length > 0) {
              const cardsToTake = playablePile.slice(-3);
              const remainingPlayablePile = playablePile.slice(0, playablePile.length - cardsToTake.length);
              const pileToKeep = hasPermanent8 ? [discardPile[0]] : [];
              setPlayers(prev => prev.map(p => p.id === aiPlayer.id ? { ...p, hand: [...p.hand, ...cardsToTake] } : p));
              setDiscardPile([...pileToKeep, ...remainingPlayablePile]);
              addLog(`AI pobrało ${cardsToTake.length} kart(y) ze stosu.`);
              nextTurn();
            } else {
                addLog('AI nie ma kart do zagrania i nie ma co pobrać.');
                nextTurn();
            }
        }
    }, 1500 + Math.random() * 1000);
  }, [aiPlayer, lastPlay, discardPile, players, nextTurn, minRankOrder, addLog, initiatePlay, handleChallenge, penaltyOpportunity, handleReportNoDeclaration, isOpeningMoveAvailable]);


  useEffect(() => {
    if (gamePhase !== 'PLAYING' || finalPlay || winner || animatingCards) return;

    const playerAfterTurn = players.find(p => p.id === lastPlay?.playerId);

    if (playerAfterTurn && playerAfterTurn.hand.length === 0) {
        if (lastPlay && lastPlay.isChallengeable) {
            setFinalPlay(lastPlay);
            addLog(`${playerAfterTurn.name} zagrał ostatnią kartę! Czas na ostateczne sprawdzenie.`);
        } else {
            setWinner(playerAfterTurn);
            setGamePhase('GAME_OVER');
            addLog(`Koniec gry! Wygrywa ${playerAfterTurn.name}!`);
        }
        return;
    }

    if (currentPlayer && !currentPlayer.isHuman && !revealedBluff) {
      aiTurn();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerIndex, gamePhase, players, lastPlay, animatingCards, penaltyOpportunity]);

  // EFFECT TO HANDLE AI'S FINAL CHALLENGE DECISION
  useEffect(() => {
      if (finalPlay && currentPlayer?.id === aiPlayer?.id) {
          const decideFinalChallenge = () => {
              const { declaredRank, declaredCount } = finalPlay;
              const cardsAiHasOfDeclaredRank = aiPlayer.hand.filter(c => c.rank === declaredRank).length;

              let shouldChallenge = false;
              if (cardsAiHasOfDeclaredRank + declaredCount > 4) {
                  shouldChallenge = true;
              } else {
                  const challengeChance = declaredCount === 3 ? 0.75 : 0.4;
                  if (Math.random() < challengeChance) {
                      shouldChallenge = true;
                  }
              }
              
              setTimeout(() => {
                  if (shouldChallenge) {
                      addLog("AI decyduje się na ostateczne sprawdzenie!");
                      handleFinalChallenge();
                  } else {
                      addLog("AI uznaje Twoją wygraną.");
                      handleConcedeWin();
                  }
              }, 1500 + Math.random() * 1000);
          };
          
          decideFinalChallenge();
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalPlay, currentPlayer, aiPlayer]);

  // EFFECT TO CHECK FOR A WINNER (e.g. after a challenge resolves)
  useEffect(() => {
    if (gamePhase !== 'PLAYING' || finalPlay) return;

    const potentialWinner = players.find(p => p.hand.length === 0);
    if (potentialWinner && !animatingCards) {
        const playerWhoJustPlayed = players.find(p => p.id === lastPlay?.playerId);
        if(!playerWhoJustPlayed || playerWhoJustPlayed.hand.length > 0) {
            addLog(`Koniec gry! ${potentialWinner.name} pozbył się wszystkich kart i wygrywa!`);
            setWinner(potentialWinner);
            setGamePhase('GAME_OVER');
        }
    }
  }, [players, gamePhase, finalPlay, addLog, lastPlay, animatingCards]);
  
  // EFFECT TO SCROLL LOG TO BOTTOM
  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameLog]);

  if (gamePhase === 'MENU') {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4">
        <div className="text-center">
            <h1 className="text-7xl md:text-8xl font-black mb-2 text-white tracking-tighter">OSZUST</h1>
            <p className="text-xl text-gray-400 mb-8">Polska gra karciana oparta na blefie</p>
            <ActionButton onClick={startGame} variant="primary" className="px-10 py-4 text-lg">
                Rozpocznij Grę
            </ActionButton>
        </div>
        <div className="mt-12 p-8 bg-blue-600/20 backdrop-blur-xl border border-blue-400/30 rounded-[28px] max-w-3xl text-left space-y-4">
            <h2 className="text-3xl font-bold mb-4 text-gray-100 text-center">Jak Grać?</h2>
            <div>
                <h3 className="text-xl font-bold mb-2 text-blue-400">Cel Gry</h3>
                <p className="text-gray-300">Celem jest jak najszybsze pozbycie się wszystkich kart z ręki. Gracz, którego ręka staje się pusta, natychmiast wygrywa grę.</p>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-blue-400">Przebieg Tury</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>W swojej turze wykładasz na stos 1, 3 lub 4 karty.</li>
                    <li>Kładąc karty, musisz głośno zadeklarować ich rangę (np. "trzy dziesiątki"). Zagrywane karty kładzie się zakryte.</li>
                    <li><strong>Jawne zagranie:</strong> Zagranie 4 kart tej samej rangi (np. 4 Króle) jest jawne. Tego zagrania nie można sprawdzić.</li>
                     <li><strong>Specjalne Otwarcie:</strong> Gracz z 8 Kier może na start zagrać 3 lub 4 ósemki (8 Kier odkryte, reszta zakryta). To zagranie MOŻNA sprawdzić. 8 Kier pozostaje na stole do końca gry.</li>
                    <li>Kolejny gracz musi zadeklarować rangę równą lub wyższą niż ostatnio deklarowana.</li>
                    <li>Jeśli nie chcesz lub nie możesz zagrać, możesz pobrać do 3 ostatnich kart ze stołu (jeśli są dostępne).</li>
                </ul>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-blue-400">"Sprawdzam!"</h3>
                <p className="text-gray-300">Gdy przeciwnik zagra, możesz sprawdzić jego karty. Jeśli blefował, zbiera on wszystkie karty ze stołu (poza 8 Kier), a Ty widzisz co zagrał. Jeśli nie, Ty je zbierasz. Gracz, który zebrał karty, rozpoczyna następną turę.</p>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-blue-400">Ostatnia Karta i Kary</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                    <li>Gdy zagrywasz karty, które pozostawią Cię z jedną kartą w ręku, musisz wcisnąć "Ostatnia Karta" przed ich położeniem.</li>
                    <li>Jeśli tego nie zrobisz, po 3 sekundach przeciwnik dostanie szansę na zgłoszenie. W tym czasie, oboje macie szansę zareagować - Ty możesz się poprawić, a on Cię ukarać. Kto pierwszy, ten lepszy!</li>
                    <li>Gdy zagrywasz ostatnią kartę, przeciwnik ma prawo ją sprawdzić, zanim wygrasz grę!</li>
                </ul>
            </div>
        </div>
      </div>
    );
  }

  if (!humanPlayer || !aiPlayer) {
    return <div className="min-h-screen flex justify-center items-center text-blue-400">Ładowanie...</div>
  }

  const canDeclareLastCard = humanPlayer.hand.length - selectedCards.length === 1;
  const isFourOfAKind = selectedCards.length === 4 && new Set(selectedCards.map(c => c.rank)).size === 1;
  const isFourOfAKindPlayable = isFourOfAKind && RANK_ORDER[selectedCards[0].rank] >= minRankOrder;
  const isOpeningBluffPlayable = isOpeningMoveAvailable && selectedCards.some(c => c.id === '8-Kier') && [3, 4].includes(selectedCards.length);
  const canPlaySelection = ([1, 3].includes(selectedCards.length)) || isFourOfAKindPlayable || isOpeningBluffPlayable;
  const isPlayerTurn = currentPlayer.id === humanPlayer.id;
  
  const hasPermanent8OnTable = discardPile.length > 0 && discardPile[0].id === '8-Kier';
  const playableCardCount = hasPermanent8OnTable ? discardPile.length - 1 : discardPile.length;

  return (
    <div className="min-h-screen w-full flex overflow-hidden">
      {winner && <GameOverBanner winnerName={winner.name} onRestart={startGame} />}
      {isDeclareModalOpen && <DeclareRankModal onDeclare={handlePlayCards} onClose={() => setDeclareModalOpen(false)} minRankOrder={minRankOrder} selectedCards={selectedCards} />}
      {revealedBluff && <RevealedBluffDisplay cards={revealedBluff.cards} />}
      {finalPlay && humanPlayer.id !== finalPlay.playerId && <FinalChallengeModal onChallenge={handleFinalChallenge} onConcede={handleConcedeWin} opponentName={players.find(p=>p.id === finalPlay.playerId)!.name} />}
      {animatingCards && animatingCards.cards.map((card, index) => {
          const isOpening8 = isOpeningMoveAvailable && card.id === '8-Kier';
          return <AnimatedCard key={`${animatingCards.key}-${card.id}`} card={card} from={animatingCards.from} index={index} isFaceUp={animatingCards.isFaceUp || isOpening8} />
      })}
      
      <div className="flex-grow flex flex-col p-4 md:p-8 space-y-4">
        {/* Opponent Area */}
        <OpponentDisplay player={aiPlayer} isPlayerTurn={currentPlayer.id === aiPlayer.id} lastCardDeclarerId={lastCardDeclarerId} />
        
        {/* Table Center */}
        <div className="flex-grow flex items-center justify-around">
            <div className="flex flex-col items-center space-y-4 w-48">
                 <ActionButton onClick={handleTakeCards} disabled={!isPlayerTurn || playableCardCount === 0 || isOpeningMoveAvailable} className="w-full">Pobierz 3</ActionButton>
                 {penaltyOpportunity && penaltyOpportunity.forPlayerId === humanPlayer.id && (
                    <ActionButton onClick={handleReportNoDeclaration} className="bg-red-600 hover:bg-red-500 text-white animate-pulse w-full" variant='secondary'>Zgłoś Brak Deklaracji!</ActionButton>
                 )}
            </div>

            <div className="flex flex-col items-center">
                <div className="relative w-28 h-40 flex items-center justify-center">
                    {discardPile.map((card, index) => {
                        const isPermanent8 = index === 0 && card.id === '8-Kier';
                        const randomXOffset = (card.id.charCodeAt(0) % 6) - 3; 
                        const randomRotation = (card.id.charCodeAt(2) % 8) - 4;
                        const verticalOffset = index * 0.4;

                        return (
                            <div
                                key={card.id}
                                className="absolute"
                                style={{
                                    zIndex: index,
                                    transform: `translateX(${randomXOffset}px) translateY(-${verticalOffset}px) rotate(${randomRotation}deg)`
                                }}
                            >
                                <CardComponent card={card} isFaceDown={!isPermanent8} />
                            </div>
                        )
                    })}
                    
                    {lastPlay && !lastPlay.isChallengeable && (
                         <div
                            className="absolute"
                            style={{
                                zIndex: discardPile.length,
                                transform: `translateY(-${(discardPile.length -1) * 0.4}px) rotate(${(Math.random() * 5) - 2.5}deg)`
                            }}
                        >
                            <CardComponent card={lastPlay.actualCards[0]} />
                        </div>
                    )}

                    {( (lastPlay && lastPlay.isChallengeable) || visibleDeclaration ) && (
                        <div className="absolute" style={{ zIndex: discardPile.length + 1, transform: `translateY(-${(discardPile.length - 1) * 0.4}px)` }}>
                            <DeclaredCardDisplay rank={visibleDeclaration || lastPlay!.declaredRank} />
                        </div>
                    )}

                    <span className="absolute -bottom-2 -right-2 z-20 bg-black/80 text-white font-bold px-3 py-1 rounded-full text-lg shadow-lg border border-white/20">
                        {playableCardCount}
                    </span>
                </div>
                 <p className="text-sm text-center mt-4 h-12 text-gray-400">
                    {lastPlay
                        ? <>DEKLARACJA: <br/> <span className="font-bold text-lg text-white">{`${lastPlay.declaredCount}x "${lastPlay.declaredRank}"`}</span></>
                        : <>STOS<br/><span className="font-bold text-lg text-gray-200">({playableCardCount} KART)</span></>
                    }
                </p>
            </div>

             <div className="flex flex-col items-center space-y-4 w-48">
                 <ActionButton onClick={handleChallenge} disabled={!isPlayerTurn || !lastPlay || !lastPlay.isChallengeable} className="w-full">Sprawdzam</ActionButton>
                 <ActionButton
                    onClick={handleLastCardButtonClick}
                    disabled={!isPlayerTurn || (!canDeclareLastCard && (!penaltyOpportunity || penaltyOpportunity.byPlayerId !== humanPlayer?.id))}
                    className={`w-full`}
                    variant={lastCardDeclarerId === humanPlayer.id ? 'secondary' : 'secondary'}
                >
                    Ostatnia Karta
                </ActionButton>
                 <ActionButton 
                    onClick={handlePlayerPlayAction} 
                    disabled={!isPlayerTurn || !canPlaySelection} 
                    className="w-full"
                    variant='primary'
                >
                    Kładę
                </ActionButton>
            </div>
        </div>

        {/* Player Area */}
        <PlayerHand 
            player={humanPlayer} 
            selectedCards={selectedCards} 
            onCardSelect={handleCardSelect} 
            isPlayerTurn={isPlayerTurn}
            lastCardDeclarerId={lastCardDeclarerId}
        />
      </div>

      {/* Game Log Panel */}
      <div className="w-full md:w-96 bg-blue-600/20 backdrop-blur-xl border-l border-blue-400/30 flex flex-col p-4 max-h-screen">
          <h2 className="text-3xl font-extrabold mb-4 text-center border-b-2 border-white/10 pb-2 text-gray-200">Log Gry</h2>
          <div ref={logContainerRef} className="flex-grow overflow-y-auto pr-2">
              <div className="space-y-3">
              {[...gameLog].reverse().map((msg, i) => (
                  <div key={i} className={`p-3 rounded-lg text-sm max-w-full break-words bg-black/20 border border-white/10`}>
                      {msg}
                  </div>
              ))}
              </div>
          </div>
      </div>
    </div>
  );
}

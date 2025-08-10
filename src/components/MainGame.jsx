import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';
import Player from './Player';
import Dealer from './Dealer';
import Controls from './Controls';
import ActualDeckControl from './ActualDeckControl';
import { useVK } from '../hooks/useVK';

const createPlayerDeck = (customCards = []) => {
  const newDeck = [];
  if (customCards.length > 0) {
    for (let card of customCards) {
      newDeck.push({ value: card.value, suit: card.suit, id: card.id, special: card.special, effect: card.effect });
    }
  } else {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let idCounter = 1000;
    for (let suit of suits) {
      for (let value of values) {
        newDeck.push({ id: idCounter++, value, suit, special: false });
      }
    }
  }
  return shuffleDeck(newDeck);
};

const createDealerDeck = () => {
  const newDeck = [];
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let idCounter = 2000;
  for (let suit of suits) {
    for (let value of values) {
      newDeck.push({ id: idCounter++, value, suit, special: false });
    }
  }
  return shuffleDeck(newDeck);
};

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const calculateScore = (hand, isPlayerHand = true) => {
  let score = 0;
  let hasAce = false;

  for (let card of hand) {
    if (card.special) continue;

    let cardValue = 0;
    if (['J', 'Q', 'K'].includes(card.value)) {
      cardValue = 10;
    } else if (card.value === 'A') {
      hasAce = true;
      cardValue = 11;
    } else {
      cardValue = parseInt(card.value, 10);
    }

    // Применяем множитель для масти только для игрока
    if (isPlayerHand) {
      const suitMultiplier = gameStore.getSuitMultiplier(card.suit);
      cardValue = Math.floor(cardValue * suitMultiplier);
    }

    score += cardValue;
  }

  if (hasAce && score > 21) score -= 10;
  return score;
};

const MainGame = observer(() => {
  // VK функциональность
  const { vibrate, shareScore, sendStats } = useVK();
  
  // dealer deck остаётся локально, колода игрока — только в store
  const [dealerDeck, setDealerDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // модалка с текущей колодой
  const [showDeck, setShowDeck] = useState(false);

  useEffect(() => {
    if (isGameActive) {
      startNewGame();
    }
  }, [isGameActive]);

  useEffect(() => {
    if (!isPlayerTurn && isGameActive) {
      handleDealerTurn();
    }
  }, [isPlayerTurn, isGameActive]);

  useEffect(() => {
    if (!showDeck) return;
    const onKey = (e) => e.key === 'Escape' && setShowDeck(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDeck]);

  const startNewGame = () => {
    // создаём новую перемешанную колоду игрока из выбранных в редакторе карт (store)
    const shuffledPlayerDeck = createPlayerDeck(gameStore.playerDeck);
    const shuffledDealerDeck = createDealerDeck();

    gameStore.generateNewTarget();
    gameStore.generateSuitMultipliers();

    if (shuffledPlayerDeck.length < 2 || shuffledDealerDeck.length < 2) {
      setWinner('Not enough cards in the deck to play! Add more cards in Deck Editor.');
      setIsGameActive(false);
      return;
    }

    // раздаём по 2 карты, остаток колоды игрока пишем в store
    const deckAfterDeal = [...shuffledPlayerDeck];
    const newPlayerHand = [deckAfterDeal.pop(), deckAfterDeal.pop()];
    const newDealerHand = [shuffledDealerDeck.pop(), shuffledDealerDeck.pop()];

    gameStore.playerDeck = deckAfterDeal;

    setDealerDeck(shuffledDealerDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setPlayerScore(calculateScore(newPlayerHand, true));
    setDealerScore(calculateScore(newDealerHand, false));
    setIsPlayerTurn(true);
    setWinner('');
    setIsGameActive(true);
  };

  const checkWinner = (finalPlayerScore, finalDealerScore) => {
    const target = gameStore.currentTarget;

    if (gameStore.activeEffects.shield && finalPlayerScore > target) {
      finalPlayerScore = target;
      gameStore.activeEffects.shield = false;
    }

    let gameResult = '';
    if (finalPlayerScore > target) {
      setWinner('Dealer wins!');
      gameResult = 'loss';
      vibrate('error');
    } else if (finalDealerScore > target) {
      setWinner('Player wins!');
      gameStore.addCoins(10);
      gameResult = 'win';
      vibrate('success');
    } else if (finalPlayerScore === finalDealerScore) {
      setWinner('Push!');
      gameResult = 'draw';
      vibrate('light');
    } else if (finalPlayerScore > finalDealerScore) {
      setWinner('Player wins!');
      gameStore.addCoins(10);
      gameResult = 'win';
      vibrate('success');
    } else {
      setWinner('Dealer wins!');
      gameResult = 'loss';
      vibrate('error');
    }
    
    // Отправляем статистику в VK
    sendStats('game_finished', {
      result: gameResult,
      player_score: finalPlayerScore,
      dealer_score: finalDealerScore,
      target: target
    });
    
    setIsGameActive(false);
  };

  const drawFromPlayerDeck = () => {
    const deck = [...gameStore.playerDeck];
    const card = deck.pop() || null;
    gameStore.playerDeck = deck; // триггерим MobX
    return card;
  };

  const handleHit = () => {
    if (!isGameActive || !isPlayerTurn || isAnimating) return;

    setIsAnimating(true);

    setTimeout(() => {
      const newCard = drawFromPlayerDeck();
      if (!newCard) {
        setIsAnimating(false);
        return;
      }

      if (newCard.special) {
        gameStore.applyCardEffect(newCard.effect);
      }

      let newPlayerHand = [...playerHand, newCard];
      let newPlayerScore = calculateScore(newPlayerHand, true);

      if (gameStore.activeEffects.extraCard) {
        const extraCard = drawFromPlayerDeck();
        if (extraCard) {
          if (extraCard.special) gameStore.applyCardEffect(extraCard.effect);
          newPlayerHand.push(extraCard);
          newPlayerScore = calculateScore(newPlayerHand, true);
        }
        gameStore.activeEffects.extraCard = false;
      }

      setPlayerHand(newPlayerHand);
      setPlayerScore(newPlayerScore);
      setIsAnimating(false);

      if (newPlayerScore >= gameStore.currentTarget) {
        setIsPlayerTurn(false);
        if (newPlayerScore === gameStore.currentTarget) {
          setWinner('Perfect! Player wins!');
          gameStore.addCoins(20);
          setIsGameActive(false);
        }
      }
    }, 500);
  };

  const handleStand = () => {
    if (!isGameActive || !isPlayerTurn) return;
    setIsPlayerTurn(false);
  };

  const handleDealerTurn = () => {
    let newDealerDeck = [...dealerDeck];
    let newDealerHand = [...dealerHand];
    let newDealerScore = calculateScore(newDealerHand, false);

    if (gameStore.activeEffects.removeDealerCard) {
      if (newDealerHand.length > 0) {
        newDealerHand.pop();
        newDealerScore = calculateScore(newDealerHand, false);
      }
      gameStore.activeEffects.removeDealerCard = false;
    }

    const target = gameStore.currentTarget;
    let dealerThreshold = target <= 30 ? 17 : Math.floor(target * 0.85);

    while (newDealerScore < dealerThreshold && newDealerScore < target && newDealerDeck.length > 0) {
      newDealerHand.push(newDealerDeck.pop());
      newDealerScore = calculateScore(newDealerHand, false);
    }

    setDealerDeck(newDealerDeck);
    setDealerHand(newDealerHand);
    setDealerScore(newDealerScore);

    checkWinner(playerScore, newDealerScore);
  };

  return (
    <div className="main-game">
      <h1 className="header">Blackjack</h1>

      {/* Модалка с текущей колодой */}
      <ActualDeckControl visible={showDeck} onClose={() => setShowDeck(false)} />

      <div className="game-info">
        <div className="game-target">
          <h3>Target Score: {gameStore.currentTarget}</h3>
        </div>
        <div className="suit-multipliers">
          <h4>Suit Multipliers:</h4>
          <div className="multipliers-table">
            <div className="multiplier-item">
              <span className="suit-symbol">♠</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♠')}</span>
            </div>
            <div className="multiplier-item">
              <span className="suit-symbol red-suit">♥</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♥')}</span>
            </div>
            <div className="multiplier-item">
              <span className="suit-symbol red-suit">♦</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♦')}</span>
            </div>
            <div className="multiplier-item">
              <span className="suit-symbol">♣</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♣')}</span>
            </div>
          </div>
        </div>
        
      </div>

      <Dealer
        hand={dealerHand}
        score={dealerScore}
        showFirstCard={isPlayerTurn && !gameStore.activeEffects.revealDealerCard}
      />

      <div className="game-area">
        {/* СТОПКА КАРТ — клик открывает модалку */}
        <div
          className={`deck-stack ${isAnimating ? 'animate-deal' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Show current deck"
          onClick={() => setShowDeck(true)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowDeck(true)}
          title="Показать текущую колоду"
          style={{ cursor: 'pointer' }}
        >
          <div className="card back-card">?</div>
        </div>

        {winner && (
          <div className="winner-section">
            <h2 className="winner-message">{winner}</h2>
            {(winner.includes('Player wins!')) && (
              <button 
                className="share-button"
                onClick={() => shareScore(playerScore)}
                title="Поделиться результатом"
              >
                📤 Поделиться
              </button>
            )}
          </div>
        )}
        <Player hand={playerHand} score={playerScore} />
      </div>

      <Controls
        onHit={handleHit}
        onStand={handleStand}
        onNewGame={startNewGame}
        isGameActive={isGameActive && isPlayerTurn}
      />
    </div>
  );
});

export default MainGame;

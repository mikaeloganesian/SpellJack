import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';
import Player from './Player';
import Dealer from './Dealer';
import Controls from './Controls';

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
  const dealerValues = ['10', 'J', 'Q', 'K', 'A'];
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let idCounter = 2000;
  for (let suit of suits) {
    for (let value of values) {
      if (dealerValues.includes(value)) {
        newDeck.push({ id: idCounter++, value, suit, special: false });
      }
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

const calculateScore = (hand) => {
  let score = 0;
  let hasAce = false;

  for (let card of hand) {
    if (card.special) {
      continue;
    }
    if (['J', 'Q', 'K'].includes(card.value)) {
      score += 10;
    } else if (card.value === 'A') {
      hasAce = true;
      score += 11;
    } else {
      score += parseInt(card.value);
    }
  }

  if (hasAce && score > 21) {
    score -= 10;
  }

  return score;
};

const MainGame = observer(() => {
  const [playerDeck, setPlayerDeck] = useState([]);
  const [dealerDeck, setDealerDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const startNewGame = () => {
    const newShuffledPlayerDeck = createPlayerDeck(gameStore.playerDeck);
    const newShuffledDealerDeck = createDealerDeck();
    
    if (newShuffledPlayerDeck.length < 2 || newShuffledDealerDeck.length < 2) {
      setWinner('Not enough cards in the deck to play!');
      setIsGameActive(false);
      return;
    }

    const newPlayerHand = [newShuffledPlayerDeck.pop(), newShuffledPlayerDeck.pop()];
    const newDealerHand = [newShuffledDealerDeck.pop(), newShuffledDealerDeck.pop()];

    setPlayerDeck(newShuffledPlayerDeck);
    setDealerDeck(newShuffledDealerDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setPlayerScore(calculateScore(newPlayerHand));
    setDealerScore(calculateScore(newDealerHand));
    setIsPlayerTurn(true);
    setWinner('');
    setIsGameActive(true);
  };

  const checkWinner = (finalPlayerScore, finalDealerScore) => {
    if (gameStore.activeEffects.shield && finalPlayerScore > 21) {
      finalPlayerScore = 21;
      gameStore.activeEffects.shield = false;
    }
    
    if (finalPlayerScore > 21) {
      setWinner('Dealer wins!');
    } else if (finalDealerScore > 21) {
      setWinner('Player wins!');
      gameStore.addCoins(10);
    } else if (finalPlayerScore === finalDealerScore) {
      setWinner('Push!');
    } else if (finalPlayerScore > finalDealerScore) {
      setWinner('Player wins!');
      gameStore.addCoins(10);
    } else {
      setWinner('Dealer wins!');
    }
    setIsGameActive(false);
  };

  const handleHit = () => {
    if (!isGameActive || !isPlayerTurn || isAnimating) return;

    setIsAnimating(true);
    
    setTimeout(() => {
      const newPlayerDeck = [...playerDeck];
      const newCard = newPlayerDeck.pop();

      if (!newCard) {
        setIsAnimating(false);
        return;
      }

      if (newCard.special) {
        gameStore.applyCardEffect(newCard.effect);
      }

      let newPlayerHand = [...playerHand, newCard];
      let newPlayerScore = calculateScore(newPlayerHand);

      if (gameStore.activeEffects.extraCard) {
        if (newPlayerDeck.length > 0) {
          const extraCard = newPlayerDeck.pop();
          if (extraCard && extraCard.special) {
            gameStore.applyCardEffect(extraCard.effect);
          }
          newPlayerHand.push(extraCard);
          newPlayerScore = calculateScore(newPlayerHand);
        }
        gameStore.activeEffects.extraCard = false;
      }
  
      setPlayerDeck(newPlayerDeck);
      setPlayerHand(newPlayerHand);
      setPlayerScore(newPlayerScore);
  
      setIsAnimating(false);
  
      if (newPlayerScore >= 21) {
        setIsPlayerTurn(false);
        if (newPlayerScore === 21) {
          setWinner('Blackjack! Player wins!');
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
    let newDealerScore = calculateScore(newDealerHand);
    
    if (gameStore.activeEffects.removeDealerCard) {
      if (newDealerHand.length > 0) {
        newDealerHand.pop();
        newDealerScore = calculateScore(newDealerHand);
      }
      gameStore.activeEffects.removeDealerCard = false;
    }
    
    while (newDealerScore < 17 && newDealerDeck.length > 0) {
      newDealerHand.push(newDealerDeck.pop());
      newDealerScore = calculateScore(newDealerHand);
    }

    setDealerDeck(newDealerDeck);
    setDealerHand(newDealerHand);
    setDealerScore(newDealerScore);

    checkWinner(playerScore, newDealerScore);
  };

  return (
    <div className="main-game">
      <h1 className="header">Blackjack</h1>
      {winner && <h2 className="winner-message">{winner}</h2>}
      <Dealer 
        hand={dealerHand} 
        score={dealerScore} 
        showFirstCard={isPlayerTurn && !gameStore.activeEffects.revealDealerCard} 
      />
      <div className="game-area">
        <div className={`deck-stack ${isAnimating ? 'animate-deal' : ''}`}>
          <div className="card back-card">?</div>
        </div>
        <Player hand={playerHand} score={playerScore} />
      </div>
      <Controls
        onHit={handleHit}
        onStand={handleStand}
        onNewGame={() => setIsGameActive(true)}
        isGameActive={isGameActive && isPlayerTurn}
      />
    </div>
  );
});

export default MainGame;
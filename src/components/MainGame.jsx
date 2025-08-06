import React, { useState, useEffect } from 'react';
import Player from './Player';
import Dealer from './Dealer';
import Controls from './Controls';
import '../App.css';

const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Эта функция теперь создает полную колоду, если customCards не предоставлены
const createDeck = (customCards = []) => {
  const newDeck = [];
  if (customCards.length > 0) {
    for (let card of customCards) {
      newDeck.push({ value: card.value, suit: card.suit, id: card.id });
    }
  } else {
    for (let suit of suits) {
      for (let value of values) {
        newDeck.push({ value, suit });
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

const MainGame = ({ onWin, playerDeck }) => {
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);

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
    const newShuffledDeck = createDeck(playerDeck);
    
    if (newShuffledDeck.length < 4) {
      setWinner('Недостаточно карт в колоде для игры!');
      setIsGameActive(false);
      return;
    }

    const newPlayerHand = [newShuffledDeck.pop(), newShuffledDeck.pop()];
    const newDealerHand = [newShuffledDeck.pop(), newShuffledDeck.pop()];

    setDeck(newShuffledDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setPlayerScore(calculateScore(newPlayerHand));
    setDealerScore(calculateScore(newDealerHand));
    setIsPlayerTurn(true);
    setWinner('');
    setIsGameActive(true);
  };

  const checkWinner = (finalPlayerScore, finalDealerScore) => {
    if (finalPlayerScore > 21) {
      setWinner('Дилер победил!');
    } else if (finalDealerScore > 21) {
      setWinner('Игрок победил!');
      onWin(10);
    } else if (finalPlayerScore === finalDealerScore) {
      setWinner('Ничья!');
    } else if (finalPlayerScore > finalDealerScore) {
      setWinner('Игрок победил!');
      onWin(10);
    } else {
      setWinner('Дилер победил!');
    }
    setIsGameActive(false);
  };

  const handleHit = () => {
    if (!isGameActive || !isPlayerTurn) return;

    const newDeck = [...deck];
    const newPlayerHand = [...playerHand, newDeck.pop()];
    const newPlayerScore = calculateScore(newPlayerHand);

    setDeck(newDeck);
    setPlayerHand(newPlayerHand);
    setPlayerScore(newPlayerScore);

    if (newPlayerScore >= 21) {
      setIsPlayerTurn(false);
      if (newPlayerScore === 21) {
        setWinner('Блэкджек! Игрок победил!');
        onWin(20);
        setIsGameActive(false);
      }
    }
  };

  const handleStand = () => {
    if (!isGameActive || !isPlayerTurn) return;
    setIsPlayerTurn(false);
  };

  const handleDealerTurn = () => {
    let newDeck = [...deck];
    let newDealerHand = [...dealerHand];
    let newDealerScore = calculateScore(newDealerHand);

    while (newDealerScore < 17) {
      newDealerHand.push(newDeck.pop());
      newDealerScore = calculateScore(newDealerHand);
    }

    setDeck(newDeck);
    setDealerHand(newDealerHand);
    setDealerScore(newDealerScore);

    checkWinner(playerScore, newDealerScore);
  };

  return (
    <div className="main-game">
      <h1 className="header">Блэкджек</h1>
      {winner && <h2 className="winner-message">{winner}</h2>}
      <Dealer hand={dealerHand} score={dealerScore} showFirstCard={isPlayerTurn} />
      <Player hand={playerHand} score={playerScore} />
      <Controls
        onHit={handleHit}
        onStand={handleStand}
        onNewGame={() => setIsGameActive(true)}
        isGameActive={isGameActive && isPlayerTurn}
      />
    </div>
  );
};

export default MainGame;
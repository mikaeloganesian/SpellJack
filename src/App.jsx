// src/App.js
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainGame from './components/MainGame';
import Shop from './components/Shop';
import DeckEditor from './components/DeskEditor';
import Header from './components/Header';
import './App.css';

// Генерация полной стандартной колоды из 52 карт
const generateStandardDeck = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  let idCounter = 100;
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ id: idCounter++, value, suit, special: false });
    }
  }
  return deck;
};

const App = () => {
  const [coins, setCoins] = useState(100);
  const [playerDeck, setPlayerDeck] = useState([]);
  const [playerOwnedCards, setPlayerOwnedCards] = useState(generateStandardDeck()); // Используем полную колоду как стартовую коллекцию
  const [availableCards, setAvailableCards] = useState([
    { id: 1, value: 'A', suit: '♦', cost: 50, special: false },
    { id: 2, value: 'J', suit: '♥', cost: 30, special: false },
    { id: 3, value: '7', suit: '♣', cost: 20, special: false }
  ]);

  const addCoins = (amount) => {
    setCoins(prevCoins => prevCoins + amount);
  };

  const onBuy = (card) => {
    setPlayerOwnedCards(prevCards => [...prevCards, card]);
  };

  return (
    <div className="app">
      <Header coins={coins} />
      <Routes>
        <Route path="/" element={<MainGame onWin={addCoins} playerDeck={playerDeck} />} />
        <Route path="/shop" element={<Shop coins={coins} setCoins={setCoins} availableCards={availableCards} setAvailableCards={setAvailableCards} onBuy={onBuy} />} />
        <Route 
          path="/deck-editor" 
          element={<DeckEditor 
            playerDeck={playerDeck} 
            setPlayerDeck={setPlayerDeck} 
            playerOwnedCards={playerOwnedCards}
          />} 
        />
      </Routes>
    </div>
  );
};

export default App;
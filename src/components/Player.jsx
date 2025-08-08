import React from 'react';
import { gameStore } from '../Store';

const Card = ({ card, multiplier, bonusPoints }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const hasBonus = multiplier > 1.0;
  
  return (
    <div className={`card ${isRed ? 'red-card' : ''} ${hasBonus ? 'bonus-card' : ''}`}>
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
      {hasBonus && (
        <div className="bonus-indicator">
          x{multiplier.toFixed(1)} (+{bonusPoints})
        </div>
      )}
    </div>
  );
};

const Player = ({ hand, score }) => {
  const getHandContainerClass = () => {
    const cardCount = hand.length;
    if (cardCount >= 12) return 'hand-container many-cards';
    if (cardCount >= 8) return 'hand-container medium-cards';
    return 'hand-container';
  };

  // Функция для вычисления множителя карты на основе позиции в руке
  const getCardMultiplierInfo = (card, cardIndex) => {
    if (card.special) return { multiplier: 1.0, bonusPoints: 0 };
    
    // Считаем, сколько карт с таким же достоинством уже было до этой карты
    let countBefore = 0;
    for (let i = 0; i < cardIndex; i++) {
      if (hand[i].value === card.value) {
        countBefore++;
      }
    }
    
    // Вычисляем множитель
    let multiplier = 1.0;
    if (countBefore === 1) multiplier = 1.5;           // Вторая карта
    else if (countBefore > 1) multiplier = 1.0 + (countBefore * 0.5); // Третья и далее
    
    // Вычисляем базовые очки карты
    let baseValue = 0;
    if (['J', 'Q', 'K'].includes(card.value)) {
      baseValue = 10;
    } else if (card.value === 'A') {
      baseValue = 11;
    } else {
      baseValue = parseInt(card.value);
    }
    
    const bonusPoints = Math.floor(baseValue * multiplier) - baseValue;
    
    return { multiplier, bonusPoints };
  };

  return (
    <div className="player-container">
      <h2>Player ({score})</h2>
      <div className={getHandContainerClass()}>
        {hand.map((card, index) => {
          const { multiplier, bonusPoints } = getCardMultiplierInfo(card, index);
          return (
            <Card 
              key={index} 
              card={card} 
              multiplier={multiplier}
              bonusPoints={bonusPoints}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Player;
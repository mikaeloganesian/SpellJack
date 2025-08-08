import React from 'react';
import { gameStore } from '../Store';

const Card = ({ card, suitMultiplier, bonusPoints }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const hasBonus = suitMultiplier > 1.0;
  
  return (
    <div className={`card ${isRed ? 'red-card' : ''} ${hasBonus ? 'bonus-card' : ''}`}>
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
      {hasBonus && (
        <div className="bonus-indicator">
          x{suitMultiplier} (+{bonusPoints})
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

  // Функция для вычисления бонусных очков карты по масти
  const getCardBonusInfo = (card) => {
    if (card.special) return { suitMultiplier: 1.0, bonusPoints: 0 };
    
    const suitMultiplier = gameStore.getSuitMultiplier(card.suit);
    
    // Вычисляем базовые очки карты
    let baseValue = 0;
    if (['J', 'Q', 'K'].includes(card.value)) {
      baseValue = 10;
    } else if (card.value === 'A') {
      baseValue = 11;
    } else {
      baseValue = parseInt(card.value);
    }
    
    const bonusPoints = Math.floor(baseValue * suitMultiplier) - baseValue;
    
    return { suitMultiplier, bonusPoints };
  };

  return (
    <div className="player-container">
      <h2>Player ({score})</h2>
      <div className={getHandContainerClass()}>
        {hand.map((card, index) => {
          const { suitMultiplier, bonusPoints } = getCardBonusInfo(card);
          return (
            <Card 
              key={index} 
              card={card} 
              suitMultiplier={suitMultiplier}
              bonusPoints={bonusPoints}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Player;
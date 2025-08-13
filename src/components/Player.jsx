import React from 'react';
import { gameStore } from '../Store';

const Card = ({ card, suitMultiplier, bonusPoints, isDoubleNextActive, isSelectable, onCardClick, cardIndex }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  const hasBonus = suitMultiplier > 1.0;
  const willBeDoubled = isDoubleNextActive && !card.special;
  const isAceWithArmor = card.value === 'A' && gameStore.activeEffects.aceArmor;
  const isFireAce = card.value === 'A' && gameStore.activeEffects.fireAce;
  
  return (
    <div 
      className={`card ${isRed ? 'red-card' : ''} ${hasBonus ? 'bonus-card' : ''} ${willBeDoubled ? 'double-next-card' : ''} ${isSelectable ? 'selectable-card' : ''} ${isAceWithArmor ? 'ace-armor-card' : ''} ${isFireAce ? 'fire-ace-card' : ''}`}
      onClick={isSelectable ? () => onCardClick(cardIndex) : undefined}
      style={{ cursor: isSelectable ? 'pointer' : 'default' }}
    >
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
      {hasBonus && (
        <div className="bonus-indicator">
          x{suitMultiplier} (+{bonusPoints})
        </div>
      )}
      {willBeDoubled && (
        <div className="double-next-indicator">
          ⚡ x2!
        </div>
      )}
      {isAceWithArmor && (
        <div className="ace-armor-badge">
          🛡️
        </div>
      )}
      {isFireAce && (
        <div className="fire-ace-badge">
          🔥
        </div>
      )}
      {isSelectable && (
        <div className="swap-indicator">
          🔄
        </div>
      )}
    </div>
  );
};

const Player = ({ hand, score, isCardSelectionMode, onCardSwap }) => {
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
    
    // ✅ ИСПРАВЛЕНИЕ: Учитываем эффект "Огненный туз"
    let baseValue = 0;
    if (['J', 'Q', 'K'].includes(card.value)) {
      baseValue = 10;
    } else if (card.value === 'A') {
      // ✅ Проверяем эффект "Огненный туз"
      if (gameStore.activeEffects.fireAce) {
        baseValue = 12; // Огненный туз = 12 очков
      } else {
        baseValue = 11; // Обычный туз = 11 очков
      }
    } else {
      baseValue = parseInt(card.value);
    }
    
    const bonusPoints = Math.floor(baseValue * suitMultiplier) - baseValue;
    
    return { suitMultiplier, bonusPoints };
  };

  return (
    <div className="player-container">
      <h2>
        Player ({score})
        {gameStore.activeEffects.aceArmor && (
          <span className="ace-armor-indicator"> 🛡️ Туз-броня</span>
        )}
        {gameStore.activeEffects.fireAce && (
          <span className="fire-ace-indicator"> 🔥 Огненный туз</span>
        )}
        {isCardSelectionMode && (
          <span className="selection-hint"> - Выберите карту для обмена</span>
        )}
      </h2>
      <div className={getHandContainerClass()}>
        {hand.map((card, index) => {
          const { suitMultiplier, bonusPoints } = getCardBonusInfo(card);
          // Убираем неправильную логику - эффект doubleNext не должен показываться на картах в руке
          
          return (
            <Card 
              key={index} 
              card={card} 
              suitMultiplier={suitMultiplier}
              bonusPoints={bonusPoints}
              isDoubleNextActive={false} // Всегда false, так как эффект действует на следующую карту
              isSelectable={isCardSelectionMode}
              onCardClick={onCardSwap}
              cardIndex={index}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Player;
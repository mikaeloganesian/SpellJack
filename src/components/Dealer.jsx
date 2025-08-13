import React from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const Card = ({ card, isFaceDown = false }) => {
  if (isFaceDown) {
    return <div className="card back-card">?</div>;
  }
  
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  return (
    <div className={`card ${isRed ? 'red-card' : ''}`}>
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
    </div>
  );
};

const Dealer = observer(({ hand, score, showFirstCard }) => {
  const displayScore = showFirstCard ? '?' : score;
  
  const getHandContainerClass = () => {
    const cardCount = hand.length;
    if (cardCount >= 12) return 'hand-container many-cards';
    if (cardCount >= 8) return 'hand-container medium-cards';
    return 'hand-container';
  };

  return (
    <div className={`dealer-container ${gameStore.activeEffects.dealerTrap ? 'trap-active' : ''}`}>
      <h2>
        Dealer ({displayScore})
        {gameStore.activeEffects.dealerTrap && (
          <span className="trap-indicator">🪤</span>
        )}
      </h2>
      <div className={getHandContainerClass()}>
        {hand.map((card, index) => (
          <Card key={index} card={card} isFaceDown={showFirstCard && index === 0} />
        ))}
      </div>
    </div>
  );
});

export default Dealer;
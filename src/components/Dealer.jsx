import React from 'react';

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

const Dealer = ({ hand, score, showFirstCard }) => {
  const displayScore = showFirstCard ? '?' : score;

  return (
    <div className="dealer-container">
      <h2>Dealer ({displayScore})</h2>
      <div className="hand-container">
        {hand.map((card, index) => (
          <Card key={index} card={card} isFaceDown={showFirstCard && index === 0} />
        ))}
      </div>
    </div>
  );
};

export default Dealer;
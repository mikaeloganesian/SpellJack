import React from 'react';

const Card = ({ card }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className={`card ${isRed ? 'red-card' : ''}`}>
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
    </div>
  );
};

const Player = ({ hand, score }) => (
  <div className="player-container">
    <h2>Player ({score})</h2>
    <div className="hand-container">
      {hand.map((card, index) => <Card key={index} card={card} />)}
    </div>
  </div>
);

export default Player;
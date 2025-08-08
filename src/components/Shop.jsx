import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const Card = ({ card, onHover }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div 
      className={`card ${isRed ? 'red-card' : ''} ${card.special ? 'special-card' : ''}`}
      onMouseEnter={() => onHover(card.description)}
      onMouseLeave={() => onHover('')}
    >
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
    </div>
  );
};

const Shop = observer(() => {
  const [description, setDescription] = useState('');

  const handleBuy = (card) => {
    gameStore.buyCard(card);
  };

  return (
    <div className="shop-container">
      <h2>Card Shop</h2>
      <p className="coin-balance">You have: 💰 {gameStore.coins}</p>
      <div className="card-list">
        {gameStore.availableCards.length > 0 ? (
          gameStore.availableCards.map(card => (
            <div key={card.id} className="shop-item">
              <Card card={card} onHover={setDescription} />
              <div className="buy-section">
                <span className="card-cost">💰 {card.cost}</span>
                <button onClick={() => handleBuy(card)}>Buy</button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No cards available in the shop.</p>
        )}
      </div>
      <div className="card-description">
        {<p>{description ? description : "Select a card to see info."}</p>}
      </div>
    </div>
  );
});

export default Shop;
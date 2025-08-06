import React from 'react';

const Shop = ({ coins, setCoins, availableCards, setAvailableCards, onBuy }) => {
  const handleBuy = (card) => {
    if (coins >= card.cost) {
      setCoins(coins - card.cost);
      setAvailableCards(prevCards => prevCards.filter(c => c.id !== card.id));
      onBuy(card);
    } else {
      alert('Недостаточно монет!');
    }
  };

  const Card = ({ card }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`card ${isRed ? 'red-card' : ''}`}>
        <div className="card-value">{card.value}</div>
        <div className="card-suit">{card.suit}</div>
      </div>
    );
  };

  return (
    <div className="shop-container">
      <h2>Магазин карт</h2>
      <p className="coin-balance">У вас: 💰 {coins}</p>
      <div className="card-list">
        {availableCards.map(card => (
          <div key={card.id} className="shop-item">
            <Card card={card} />
            <div className="buy-section">
              <span className="card-cost">💰 {card.cost}</span>
              <button onClick={() => handleBuy(card)}>Купить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';
import CardModal from './CardModal';

const Card = ({ card, onClick }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  // Проверяем, является ли карта специальной
  if (card.type === 'special') {
    return (
      <div 
        className="special-card-shop"
        onClick={() => onClick(card)}
      >
        <div className="card-emoji">{card.value}</div>
        <div className="card-name">{card.name}</div>
        <div className="activation-type">{card.activationType}</div>
      </div>
    );
  }
  
  return (
    <div 
      className={`card ${isRed ? 'red-card' : ''}`}
      onClick={() => onClick(card)}
    >
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
    </div>
  );
};

const Shop = observer(() => {
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const handleBuy = (card) => {
    gameStore.buyCard(card);
    handleModalClose();
  };

  const canAffordCard = (card) => {
    return gameStore.coins >= card.cost;
  };

  return (
    <div className="shop-container">
      <h2>Card Shop</h2>
      <p className="coin-balance">You have: 💰 {gameStore.coins}</p>
      <div className="card-list">
        {gameStore.availableCards.length > 0 ? (
          gameStore.availableCards.map(card => (
            <div key={card.id} className="shop-item">
              <Card card={card} onClick={handleCardClick} />
              <div className="buy-section">
                <span className="card-cost">💰 {card.cost}</span>
                <button 
                  onClick={() => handleBuy(card)}
                  disabled={!canAffordCard(card)}
                  className={!canAffordCard(card) ? 'disabled' : ''}
                >
                  {'Buy'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">No cards available in the shop.</p>
        )}
      </div>

      <CardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onBuy={handleBuy}
        canAfford={selectedCard ? canAffordCard(selectedCard) : false}
      />
    </div>
  );
});

export default Shop;
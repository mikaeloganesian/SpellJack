import React from 'react';
import { observer } from 'mobx-react-lite';

const CardModal = observer(({ card, isOpen, onClose, onBuy, canAfford, showBuySection = true }) => {
  if (!isOpen || !card) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isSpecialCard = card.type === 'special';
  const isRed = !isSpecialCard && (card.suit === '♥' || card.suit === '♦');

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="card-modal">
        <div className="modal-header">
          <h3>Информация о карте</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="card-preview">
            {isSpecialCard ? (
              <div className="special-card-large">
                <div className="card-emoji-large">{card.value}</div>
                <div className="card-name-large">{card.name}</div>
                <div className="activation-type-large">{card.activationType}</div>
              </div>
            ) : (
              <div className={`card-large ${isRed ? 'red-card' : ''}`}>
                <div className="card-value-large">{card.value}</div>
                <div className="card-suit-large">{card.suit}</div>
              </div>
            )}
          </div>

          <div className="card-info">
            <h4>{isSpecialCard ? (card.name || card.id) : `${card.value}${card.suit}`}</h4>
            
            {isSpecialCard && (
              <div className="special-info">
                <div className="activation-info">
                  <strong>Тип активации:</strong> {card.activationType}
                </div>
                <div className="activation-description">
                  {card.activationType === 'manual' && '🖱️ Активируется вручную в игре'}
                  {card.activationType === 'passive' && '⚡ Срабатывает автоматически при условии'}
                  {card.activationType === 'auto' && '🔄 Активируется сразу при взятии карты'}
                </div>
              </div>
            )}

            <div className="card-description">
              <strong>Описание:</strong>
              <p>{card.description || getCardDescription(card)}</p>
            </div>

            {showBuySection && (
              <div className="cost-section">
                <div className="card-cost-large">💰 {card.cost}</div>
                <button 
                  className={`buy-button-large ${!canAfford ? 'disabled' : ''}`}
                  onClick={() => onBuy(card)}
                  disabled={!canAfford}
                >
                  {canAfford ? 'Купить' : 'Недостаточно монет'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Функция для генерации описания обычных карт
const getCardDescription = (card) => {
  if (card.type === 'special') {
    return card.description || `Специальная карта с эффектом: ${card.effect}`;
  }
  
  const valueDescriptions = {
    'A': 'Туз - может стоить 1 или 11 очков',
    'K': 'Король - стоит 10 очков',
    'Q': 'Дама - стоит 10 очков', 
    'J': 'Валет - стоит 10 очков'
  };

  if (valueDescriptions[card.value]) {
    return valueDescriptions[card.value];
  }

  return `Числовая карта достоинством ${card.value} очков`;
};

export default CardModal;

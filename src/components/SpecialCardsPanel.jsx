import React from 'react';
import { observer } from 'mobx-react-lite';

const SpecialCardsPanel = observer(({ store }) => {
  const manualCards = store.getManualActivationCards();

  const handleCardActivation = (cardId) => {
    if (store.activateSpecialCard(cardId)) {
      // Карта успешно активирована
      console.log(`Special card ${cardId} activated!`);
    }
  };

  if (manualCards.length === 0) {
    return null;
  }

  return (
    <div className="special-cards-panel">
      <h3>Специальные карты</h3>
      <div className="special-cards-grid">
        {manualCards.map(card => (
          <div 
            key={card.id}
            className="special-card-item"
            onClick={() => handleCardActivation(card.id)}
          >
            <div className="card-emoji">{card.value}</div>
            <div className="card-name">{card.id}</div>
            <div className="activation-hint">Нажмите для активации</div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SpecialCardsPanel;

import React from 'react';
import { observer } from 'mobx-react-lite';

const SpecialCardsPanel = observer(({ store, onCardSwapActivate, onResetHand, onCriticalChoiceActivate, onCartographerActivate, isBlocked = false }) => {
  const manualCards = store.getManualActivationCards();
  const passiveCards = store.activeSpecialCards.filter(card => card.activationType === 'passive');

  const handleCardActivation = (cardId) => {
    const card = manualCards.find(c => c.id === cardId);
    
    // Особая логика для карты "Обмен удачи"
    if (card && card.effect === 'swapCard') {
      if (onCardSwapActivate) {
        onCardSwapActivate(); // Активируем режим выбора карты в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }
    
    // Особая логика для карты "Сброс напряжения"
    if (card && card.effect === 'resetHand') {
      if (onResetHand) {
        onResetHand(); // Активируем сброс руки в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }
    
    // Особая логика для карты "Критический выбор"
    if (card && card.effect === 'criticalChoice') {
      if (onCriticalChoiceActivate) {
        onCriticalChoiceActivate(); // Активируем критический выбор в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }
    
    // Особая логика для карты "Картограф"
    if (card && card.effect === 'showNextSuit') {
      if (onCartographerActivate) {
        onCartographerActivate(); // Активируем картограф в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }
    
    // Обычная активация для остальных карт
    if (store.activateSpecialCard(cardId)) {
      console.log(`Special card ${cardId} activated!`);
    }
  };

  const getCardStatus = (card) => {
    if (card.effect === 'doubleNext' && store.activeEffects.doubleNext) {
      return 'Готов к удвоению!';
    }
    if (card.effect === 'dealerTrap' && store.activeEffects.dealerTrap) {
      return 'Ловушка установлена!';
    }
    if (card.effect === 'swapCard' && store.activeEffects.swapCard) {
      return 'Выберите карту!';
    }
    if (card.effect === 'resetHand') {
      return 'Сбросить всю руку!';
    }
    if (card.effect === 'criticalChoice') {
      return 'Выбрать из 3 карт!';
    }
    if (card.effect === 'showNextSuit') {
      return 'Показать масть!';
    }
    return 'Нажмите для активации';
  };

  const getPassiveStatus = (card) => {
    if (card.effect === 'aceArmor' && store.activeEffects.aceArmor) {
      return 'Дополнительная защита!';
    }
    if (card.effect === 'shield' && store.activeEffects.shield) {
      return 'Щит активен!';
    }
    if (card.effect === 'fireAce' && store.activeEffects.fireAce) {
      return 'Тузы = 12 очков!';
    }
    if (card.effect === 'doubleBet' && store.activeEffects.doubleBet) {
      return 'Двойная награда!';
    }
    if (card.effect === 'luckySeven' && store.activeEffects.luckySeven) {
      return 'Бонус за семёрки!';
    }
    if (card.effect === 'royalDecree' && store.activeEffects.royalDecree) {
      return 'Фигуры +2 очка!';
    }
    return 'Пассивный эффект';
  };

  const getCardClass = (card) => {
    if (card.effect === 'doubleNext' && store.activeEffects.doubleNext) {
      return 'special-card-item active-effect';
    }
    if (card.effect === 'dealerTrap' && store.activeEffects.dealerTrap) {
      return 'special-card-item active-effect trap-effect';
    }
    if (card.effect === 'swapCard' && store.activeEffects.swapCard) {
      return 'special-card-item active-effect swap-effect';
    }
    if (card.effect === 'resetHand') {
      return 'special-card-item reset-hand-effect';
    }
    if (card.effect === 'criticalChoice') {
      return 'special-card-item critical-choice-effect';
    }
    if (card.effect === 'showNextSuit') {
      return 'special-card-item cartographer-effect';
    }
    return 'special-card-item';
  };

  const getPassiveCardClass = (card) => {
    if (card.effect === 'aceArmor' && store.activeEffects.aceArmor) {
      return 'special-card-item passive-effect ace-armor-effect';
    }
    if (card.effect === 'shield' && store.activeEffects.shield) {
      return 'special-card-item passive-effect shield-effect';
    }
    if (card.effect === 'fireAce' && store.activeEffects.fireAce) {
      return 'special-card-item passive-effect fire-effect';
    }
    if (card.effect === 'doubleBet' && store.activeEffects.doubleBet) {
      return 'special-card-item passive-effect gold-effect';
    }
    if (card.effect === 'luckySeven' && store.activeEffects.luckySeven) {
      return 'special-card-item passive-effect lucky-effect';
    }
    if (card.effect === 'royalDecree' && store.activeEffects.royalDecree) {
      return 'special-card-item passive-effect royal-effect';
    }
    return 'special-card-item passive-effect';
  };

  if (manualCards.length === 0 && passiveCards.length === 0) {
    return null;
  }

  return (
    <div className="special-cards-panel">
      {manualCards.length > 0 && (
        <>
          <h3>Специальные карты</h3>
          <div className="special-cards-grid">
            {manualCards.map(card => (
              <div 
                key={card.id}
                className={getCardClass(card)}
                onClick={() => !isBlocked && handleCardActivation(card.id)}
                style={{ opacity: isBlocked ? 0.5 : 1, cursor: isBlocked ? 'not-allowed' : 'pointer' }}
              >
                <div className="card-emoji">{card.value}</div>
                <div className="card-name">{card.name}</div>
                <div className="activation-hint">{getCardStatus(card)}</div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {passiveCards.length > 0 && (
        <>
          <h3>Пассивные эффекты</h3>
          <div className="special-cards-grid">
            {passiveCards.map(card => (
              <div 
                key={card.id}
                className={getPassiveCardClass(card)}
              >
                <div className="card-emoji">{card.value}</div>
                <div className="card-name">{card.name}</div>
                <div className="activation-hint">{getPassiveStatus(card)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default SpecialCardsPanel;

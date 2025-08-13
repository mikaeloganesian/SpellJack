import React from 'react';
import { observer } from 'mobx-react-lite';

const SpecialCardsPanel = observer(({ store, onCardSwapActivate, onResetHand, onCriticalChoiceActivate, onCartographerActivate, onLeafFallActivate, onForesightActivate, onSuitMagnetActivate, onDestinyActivate, isBlocked = false }) => {
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
    
    // Особая логика для карты "Листопад"
    if (card && card.effect === 'leafFall') {
      if (onLeafFallActivate) {
        onLeafFallActivate(); // Активируем листопад в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }
    
    // Особая логика для карты "Карта предвидения"
    if (card && card.effect === 'foresight') {
      if (onForesightActivate) {
        onForesightActivate(); // Активируем предвидение в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }
    
    // Особая логика для карты "Магнит мастей"
    if (card && card.effect === 'suitMagnet') {
      if (onSuitMagnetActivate) {
        onSuitMagnetActivate(); // Активируем выбор масти в MainGame
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Special card ${cardId} activated!`);
      }
      return;
    }

    // Особая логика для карты "Карта судьбы"
    if (card && card.effect === 'destiny') {
      if (onDestinyActivate) {
        onDestinyActivate(); // Активируем предсказание карты судьбы
      }
      // Активируем карту в store
      if (store.activateSpecialCard(cardId)) {
        console.log(`Destiny card ${cardId} activated!`);
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
    if (card.effect === 'leafFall') {
      return 'Сбросить карту +3💰!';
    }
    if (card.effect === 'foresight') {
      return 'Показать 2 карты!';
    }
    if (card.effect === 'stabilizer') {
      return store.activeEffects.stabilizer ? 'Коэффициенты x1.0!' : 'Убрать случайность!';
    }
    if (card.effect === 'goldenTouch') {
      return store.activeEffects.goldenTouch ? 'Готов к золоту!' : 'Монеты = очки!';
    }
    if (card.effect === 'chronometer') {
      return store.activeEffects.chronometer > 0 ? `Осталось ${store.activeEffects.chronometer} карт!` : 'Замедлить время!';
    }
    if (card.effect === 'suitMagnet') {
      return store.activeEffects.suitMagnetActive ? 'Выберите масть!' : 'Усилить масть +1!';
    }
    if (card.effect === 'destiny') {
      return store.requiresDestinyPreview ? 'Посмотрите будущее!' : 'Предсказать карту!';
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
    if (card.effect === 'luckySuit' && store.activeEffects.luckySuitActive) {
      return `Усилена ${store.activeEffects.luckySuitActive}!`;
    }
    if (card.effect === 'royalDecree' && store.activeEffects.royalDecree) {
      return 'Все карты +2 очка!';
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
    if (card.effect === 'leafFall') {
      return 'special-card-item leaf-fall-effect';
    }
    if (card.effect === 'foresight') {
      return 'special-card-item foresight-effect';
    }
    if (card.effect === 'stabilizer') {
      return store.activeEffects.stabilizer ? 'special-card-item stabilizer-effect active' : 'special-card-item stabilizer-effect';
    }
    if (card.effect === 'goldenTouch') {
      return store.activeEffects.goldenTouch ? 'special-card-item golden-touch-effect active' : 'special-card-item golden-touch-effect';
    }
    if (card.effect === 'chronometer') {
      return store.activeEffects.chronometer > 0 ? 'special-card-item chronometer-effect active' : 'special-card-item chronometer-effect';
    }
    if (card.effect === 'suitMagnet') {
      return store.activeEffects.suitMagnetActive ? 'special-card-item suit-magnet-effect active' : 'special-card-item suit-magnet-effect';
    }
    if (card.effect === 'destiny') {
      return store.requiresDestinyPreview ? 'special-card-item destiny-effect active' : 'special-card-item destiny-effect';
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
    if (card.effect === 'luckySuit' && store.activeEffects.luckySuitActive) {
      return 'special-card-item passive-effect lucky-suit-effect';
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

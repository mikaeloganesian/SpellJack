import { makeObservable, observable, action } from 'mobx';
import { specialCards } from './data/specialCards';

const generateStandardDeck = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const deck = [];
  let idCounter = 100;
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ id: idCounter++, value, suit, special: false });
    }
  }
  return deck;
};

const generateStarterDeck = () => {
  // Стартовая колода: простые карты 2-10 всех мастей (полная колода)
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const deck = [];
  let idCounter = 100;
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ id: idCounter++, value, suit, special: false });
    }
  }
  return deck; // Возвращаем всю стартовую колоду (36 карт)
};


const generateStartedOwnedDeck = () => {
  const suits = ['♠', '♥', '♦', '♣'];
  const values = [ 'J', 'Q', 'K', 'A'];
  const deck = [];
  let idCounter = 10000;
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ id: idCounter++, value, suit, special: false });
    }
  }
  return deck;
}

class GameStore {
  coins = 100;
  playerDeck = generateStarterDeck();        // Игровая колода (36 карт для игры)
  playerOwnedCards = generateStartedOwnedDeck(); // Все купленные карты (коллекция)
  availableCards = specialCards;
  currentTarget = 21;                        // Текущая цель игры

  // Коэффициенты для мастей в текущей игре
  suitMultipliers = {};                      // {suit: multiplier} для каждой масти

  // Система специальных карт
  activeSpecialCards = [];                   // Спец.карты в руке (макс 3 в колоде)
  usedSpecialEffects = [];                   // Использованные эффекты в партии
  
  activeEffects = {
    // Старые эффекты
    shield: false,
    revealDealerCard: false,
    extraCard: false,
    
    // Новые эффекты
    doubleNext: false,
    aceArmor: false,
    fireAce: false,
    doubleBet: false,
    luckySeven: false,
    royalDecree: false,
    dealerFrozen: false,
    goldenTouch: false,
    suitMagnetActive: null, // какая масть получает бонус
  };

  constructor() {
    makeObservable(this, {
      coins: observable,
      playerDeck: observable,
      playerOwnedCards: observable,
      availableCards: observable,
      currentTarget: observable,
      suitMultipliers: observable,
      activeEffects: observable,
      activeSpecialCards: observable,
      usedSpecialEffects: observable,
      addCoins: action,
      addCardToDeck: action,
      removeCardFromDeck: action,
      buyCard: action,
      applyCardEffect: action,
      addSpecialCardToDeck: action,
      removeSpecialCardFromDeck: action,
      activateSpecialCard: action,
      resetGameEffects: action,
      applyAutoEffects: action,
      checkPassiveEffects: action,
      removeDealerCardEffect: action,
      addExtraCardEffect: action,
      generateNewTarget: action,
      generateSuitMultipliers: action,
    });
  }

  addCoins(amount) {
    this.coins += amount;
  }

  addCardToDeck(card) {
    if (this.playerDeck.length < 52) {
      this.playerDeck.push(card);
    }
  }

  removeCardFromDeck(cardId) {
    const removed = this.playerDeck.find(c => c.id === cardId);
    if (!removed) return;
    this.playerDeck = this.playerDeck.filter(c => c.id !== cardId);
    this.playerOwnedCards.push(removed);
  }


  buyCard(card) {
    if (this.coins >= card.cost) {
      this.coins -= card.cost;
      this.playerOwnedCards.push(card);
      this.availableCards = this.availableCards.filter(c => c.id !== card.id);
    }
  }

  // Методы для управления специальными картами
  addSpecialCardToDeck(card) {
    if (this.activeSpecialCards.length >= 3) {
      return false; // Максимум 3 спец.карты в колоде
    }
    this.activeSpecialCards.push(card);
    return true;
  }

  removeSpecialCardFromDeck(cardId) {
    this.activeSpecialCards = this.activeSpecialCards.filter(card => card.id !== cardId);
  }

  canActivateCard(cardId) {
    return !this.usedSpecialEffects.includes(cardId);
  }

  activateSpecialCard(cardId) {
    const card = this.activeSpecialCards.find(c => c.id === cardId);
    if (!card || this.usedSpecialEffects.includes(cardId)) {
      return false;
    }

    this.usedSpecialEffects.push(cardId);
    this.applyCardEffect(card.effect);
    return true;
  }

  applyCardEffect(effectName) {
    switch (effectName) {
      // Старые эффекты
      case 'addCoins':
        this.addCoins(10);
        break;
      case 'shield':
        this.activeEffects.shield = true;
        break;
      case 'revealDealerCard':
        this.activeEffects.revealDealerCard = true;
        break;
      case 'removeDealerCard':
        this.activeEffects.removeDealerCard = true;
        break;
      case 'extraCard':
        this.activeEffects.extraCard = true;
        break;
      
      // Новые эффекты
      case 'doubleNext':
        this.activeEffects.doubleNext = true;
        break;
      case 'aceArmor':
        this.activeEffects.aceArmor = true;
        break;
      case 'fireAce':
        this.activeEffects.fireAce = true;
        break;
      case 'doubleBet':
        this.activeEffects.doubleBet = true;
        break;
      case 'luckySeven':
        this.activeEffects.luckySeven = true;
        break;
      case 'royalDecree':
        this.activeEffects.royalDecree = true;
        break;
      case 'dealerFrozen':
        this.activeEffects.dealerFrozen = true;
        break;
      case 'goldenTouch':
        this.activeEffects.goldenTouch = true;
        break;
      case 'suitMagnet':
        // Требует дополнительной логики для выбора масти
        this.activeEffects.suitMagnetActive = '♠'; // По умолчанию пики
        break;
      case 'chooseFromThree':
        // Эффект будет обработан в игровой логике
        console.log('Choose from three cards activated');
        break;
      case 'swapDealerCard':
        // Эффект будет обработан в игровой логике
        console.log('Swap with dealer card activated');
        break;
      case 'perfectVision':
        // Эффект будет обработан в игровой логике
        console.log('Perfect vision activated');
        break;
      case 'timeRewind':
        // Эффект будет обработан в игровой логике
        console.log('Time rewind activated');
        break;
      case 'invisibleCard':
        // Эффект будет обработан в игровой логике
        console.log('Invisible card activated');
        break;
      case 'dealerMirror':
        // Эффект будет обработан в игровой логике
        console.log('Dealer mirror activated');
        break;
      case 'fortuneWheel':
        // Случайный эффект
        const randomEffects = ['doubleNext', 'aceArmor', 'fireAce', 'extraCard'];
        const randomEffect = randomEffects[Math.floor(Math.random() * randomEffects.length)];
        this.applyCardEffect(randomEffect);
        break;
      case 'lastChance':
        // Эффект будет обработан в игровой логике при проигрыше
        console.log('Last chance activated');
        break;
      case 'shadowClone':
        // Эффект будет обработан в игровой логике
        console.log('Shadow clone activated');
        break;
      case 'ultimatePower':
        // Комбо эффект
        this.activeEffects.doubleNext = true;
        this.activeEffects.aceArmor = true;
        this.activeEffects.extraCard = true;
        break;
      
      default:
        console.log(`Unknown effect: ${effectName}`);
    }
  }

  // Сброс эффектов в начале новой игры
  resetGameEffects() {
    this.usedSpecialEffects = [];
    this.activeEffects = {
      shield: false,
      revealDealerCard: false,
      extraCard: false,
      doubleNext: false,
      aceArmor: false,
      fireAce: false,
      doubleBet: false,
      luckySeven: false,
      royalDecree: false,
      dealerFrozen: false,
      goldenTouch: false,
      suitMagnetActive: null,
    };
  }

  // Получить карты доступные для ручной активации
  getManualActivationCards() {
    return this.activeSpecialCards.filter(card => 
      card.activationType === 'manual' && 
      !this.usedSpecialEffects.includes(card.id)
    );
  }

  // Применить автоматические эффекты при взятии карты
  applyAutoEffects() {
    this.activeSpecialCards
      .filter(card => card.activationType === 'auto' && !this.usedSpecialEffects.includes(card.id))
      .forEach(card => {
        this.activateSpecialCard(card.id);
      });
  }

  // Применить пассивные эффекты (проверяются в игровой логике)
  checkPassiveEffects(context) {
    this.activeSpecialCards
      .filter(card => card.activationType === 'passive' && !this.usedSpecialEffects.includes(card.id))
      .forEach(card => {
        // Пассивные эффекты проверяются по условиям в игровой логике
        this.checkPassiveCondition(card, context);
      });
  }

  checkPassiveCondition(card, context) {
    // Здесь будет логика проверки условий для пассивных карт
    // context содержит информацию о текущем состоянии игры
    console.log(`Checking passive condition for ${card.id}`, context);
  }

  removeDealerCardEffect() {
    this.activeEffects.removeDealerCard = false;
  }

  addExtraCardEffect() {
    this.activeEffects.extraCard = false;
  }

  generateNewTarget() {
    this.currentTarget = Math.floor(Math.random() * (100 - 21 + 1)) + 21;
  }


  generateSuitMultipliers() {
    const suits = ['♠', '♥', '♦', '♣'];
    this.suitMultipliers = {};
    
    suits.forEach(suit => {
      // Генерируем коэффициент от 1.0 до 4.0 с одним знаком после запятой
      const multiplier = Math.round((Math.random() * 3 + 1) * 10) / 10;
      this.suitMultipliers[suit] = multiplier;
    });
  }


  getSuitMultiplier(suit) {
    return this.suitMultipliers[suit] || 1.0;
  }
}

export const gameStore = new GameStore();
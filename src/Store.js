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
    // === 21 эффект из специальных карт ===

    // 1. Открытый взгляд
    revealDealerCard: false,

    // 2. Щит перегруза
    shield: false,

    // 3. Двойной удар
    doubleNext: false,

    // 4. Карта-ловушка
    dealerTrap: false,

    // 5. Обмен удачи
    swapCard: false,

    // 6. Тузовая броня
    aceArmor: false,

    // 7. Сброс напряжения (обрабатывается в игровой логике)

    // 8. Критический выбор (обрабатывается в игровой логике)

    // 9. Двойная ставка
    doubleBet: false,


    // 10. Картограф (обрабатывается в игровой логике)

    // 11. Огненный туз
    fireAce: false,

    // 12. Счастливая семёрка
    luckySeven: false,

    // 13. Хамелеон (обрабатывается в игровой логике)

    // 14. Масть удачи (изменяет suitMultipliers напрямую)

    // 15. Карта предвидения (обрабатывается в игровой логике)

    // 16. Ледяное сердце
    dealerFrozen: false,

    // 17. Золотое касание
    goldenTouch: false,

    // 18. Временная петля (обрабатывается в игровой логике)

    // 19. Магнит мастей 
    suitMagnetActive: null, // Активная масть для магнитного эффекта

    // 20. Карта судьбы (обрабатывается в игровой логике

    // 21. Королевский указ
    royalDecree: false,

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
      disableDealerTrap: action,
      disableSwapCard: action,
      disableShield: action,
      applyAutoEffects: action,
      checkPassiveEffects: action,
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


  // Метод покупки карты в разделе Shop
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
      // === 21 карта из базы специальных карт ===
      
      case 'revealDealerCard':
        this.activeEffects.revealDealerCard = true;
        break;
      
      case 'shield':
        this.activeEffects.shield = true;
        break;
      
      case 'doubleNext':
        this.activeEffects.doubleNext = true;
        break;
      
      case 'dealerTrap':
        this.activeEffects.dealerTrap = true;
        break;
      
      case 'swapCard':
        this.activeEffects.swapCard = true;
        break;
      
      case 'aceArmor':
        this.activeEffects.aceArmor = true;
        break;
      
      case 'resetHand':
        console.log('Reset hand activated');
        break;
      
      case 'criticalChoice':
        console.log('Critical choice activated');
        break;
      
      case 'doubleBet':
        this.activeEffects.doubleBet = true;
        break;
      
      case 'showNextSuit':
        console.log('Show next suit activated');
        break;
      
      case 'fireAce':
        this.activeEffects.fireAce = true;
        break;
      
      case 'luckySeven':
        this.activeEffects.luckySeven = true;
        break;
      
      case 'chameleon':
        console.log('Chameleon activated');
        break;
      
      case 'luckySuit':
        const suits = ['♠', '♥', '♦', '♣'];
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const currentMultiplier = this.getSuitMultiplier(randomSuit);
        this.suitMultipliers[randomSuit] = Math.min(currentMultiplier * 2, 4.0);
        console.log(`Lucky suit activated: ${randomSuit} multiplier doubled to ${this.suitMultipliers[randomSuit]}`);
        break;
      
      case 'foresight':
        console.log('Foresight activated');
        break;
      
      case 'freezeDealer':
        this.activeEffects.dealerFrozen = true;
        break;
      
      case 'goldenTouch':
        this.activeEffects.goldenTouch = true;
        break;
      
      case 'timeLoop':
        console.log('Time loop activated');
        break;
      
      case 'suitMagnet':
        console.log('Suit magnet activated');
        break;
      
      case 'destiny':
        console.log('Destiny card activated');
        break;
      
      case 'royalDecree':
        this.activeEffects.royalDecree = true;
        break;
      
      // Старые эффекты для совместимости
      case 'extraCard':
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
      // Основные игровые эффекты
      revealDealerCard: false,
      shield: false,
      doubleNext: false,
      swapCard: false,
      dealerTrap: false,
      aceArmor: false,
      doubleBet: false,
      fireAce: false,
      luckySeven: false,
      dealerFrozen: false,
      goldenTouch: false,
      royalDecree: false,
      suitMagnetActive: null,
      extraCard: false,
    };
  }

  // Метод для отключения ловушки (MobX action)
  disableDealerTrap() {
    this.activeEffects.dealerTrap = false;
  }

  // Метод для отключения обмена карты (MobX action)
  disableSwapCard() {
    this.activeEffects.swapCard = false;
  }

  // Метод для отключения щита перегруза (MobX action)
  disableShield() {
    this.activeEffects.shield = false;
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
    switch(card.effect) {
      case 'shield':
        if (context === 'gameStart') {
          console.log('🛡️ Щит активирован автоматически');
          this.activeEffects.shield = true;
        }
        break;
      case 'aceArmor':
        if (context === 'gameStart') {
          this.activeEffects.aceArmor = true;
        }
        break;
      case 'fireAce':
        if (context === 'gameStart') {
          this.activeEffects.fireAce = true;
        }
        break;
      case 'doubleBet':
        if (context === 'gameStart') {
          this.activeEffects.doubleBet = true;
        }
        break;
      case 'luckySeven':
        if (context === 'gameStart') {
          this.activeEffects.luckySeven = true;
        }
        break;
      case 'royalDecree':
        if (context === 'gameStart') {
          this.activeEffects.royalDecree = true;
        }
        break;
    }
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
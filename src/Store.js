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
  playerDeck = generateStarterDeck();        // Игровая колода (10 карт для игры)
  playerOwnedCards = generateStartedOwnedDeck(); // Все купленные карты (коллекция)
  availableCards = specialCards;
  currentTarget = 21;                        // Текущая цель игры

  // Коэффициенты для мастей в текущей игре
  suitMultipliers = {};                      // {suit: multiplier} для каждой масти

  activeEffects = {
    shield: false,
    revealDealerCard: false,
    extraCard: false,
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
      addCoins: action,
      addCardToDeck: action,
      removeCardFromDeck: action,
      buyCard: action,
      applyCardEffect: action,
      removeDealerCardEffect: action,
      addExtraCardEffect: action,
      generateNewTarget: action,
      resetCardCounts: action,
      getCardMultiplier: action,
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

  applyCardEffect(effectName) {
    switch (effectName) {
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
      default:
        console.log(`Unknown effect: ${effectName}`);
    }
  }

  getSuitMultiplier(suit) {
  // пример: по умолчанию все 1
    const map = { '♠': 1, '♥': 1, '♦': 1, '♣': 1 };
    return map[suit] ?? 1;
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

  resetCardCounts() {
    this.cardValueCounts = {};
  }

  getCardMultiplier(cardValue) {
    // Получаем текущий счетчик для этого достоинства карты
    const count = this.cardValueCounts[cardValue] || 0;
    
    // Увеличиваем счетчик
    this.cardValueCounts[cardValue] = count + 1;
    
    // Возвращаем множитель: 1x, 1.5x, 2x, 2.5x, 3x...
    if (count === 0) return 1.0;           // Первая карта
    if (count === 1) return 1.5;           // Вторая карта
    return 1.0 + (count * 0.5);           // Третья и далее: 2.0, 2.5, 3.0...
  }
}

export const gameStore = new GameStore();
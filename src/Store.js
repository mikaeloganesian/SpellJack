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
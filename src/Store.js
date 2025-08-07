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

class GameStore {
  coins = 100;
  playerDeck = [];
  playerOwnedCards = generateStandardDeck();
  availableCards = specialCards;

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
      activeEffects: observable,
      addCoins: action,
      addCardToDeck: action,
      removeCardFromDeck: action,
      buyCard: action,
      applyCardEffect: action,
      removeDealerCardEffect: action,
      addExtraCardEffect: action,
    });
  }

  addCoins(amount) {
    this.coins += amount;
  }

  addCardToDeck(card) {
    if (this.playerDeck.length < 10) {
      this.playerDeck.push(card);
    }
  }

  removeCardFromDeck(cardId) {
    this.playerDeck = this.playerDeck.filter(card => card.id !== cardId);
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
}

export const gameStore = new GameStore();
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

    // 13. Листопад (обрабатывается в игровой логике)

    // 14. Масть удачи
    luckySuitActive: null, // Какая масть получила буст

    // 15. Карта предвидения (обрабатывается в игровой логике)

    // 16. Стабилизатор
    stabilizer: false,

    // 17. Золотое касание
    goldenTouch: false,

    // 18. Хронометр
    chronometer: 0, // Количество оставшихся карт с половинными очками

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
    const result = this.applyCardEffect(card.effect);
    return result || true; // Возвращаем результат или true для обратной совместимости
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
      
      case 'leafFall':
        // Листопад: сбрасывает случайную карту из руки и даёт +3 монеты
        console.log('Листопад активирован');
        break;
      
      case 'luckySuit':
        const suits = ['♠', '♥', '♦', '♣'];
        const randomSuit = suits[Math.floor(Math.random() * suits.length)];
        const currentMultiplier = this.getSuitMultiplier(randomSuit);
        const newMultiplier = Math.min(currentMultiplier * 2, 4.0);
        this.suitMultipliers[randomSuit] = newMultiplier;
        this.activeEffects.luckySuitActive = randomSuit;
        console.log(`Lucky suit activated: ${randomSuit} multiplier doubled to ${newMultiplier}`);
        
        // Возвращаем информацию для отображения
        return {
          success: true,
          message: `🌟 Масть удачи: ${randomSuit} усилена до x${newMultiplier}!`
        };
        break;
      
      case 'foresight':
        console.log('Foresight activated');
        break;
      
      case 'stabilizer':
        this.activeEffects.stabilizer = true;
        // Устанавливаем все коэффициенты на 1.0
        this.suitMultipliers = {
          '♠': 1.0,
          '♥': 1.0,
          '♦': 1.0,
          '♣': 1.0
        };
        console.log('Stabilizer activated: all suit multipliers set to 1.0');
        
        return {
          success: true,
          message: '⚖️ Стабилизатор: коэффициенты зафиксированы на 1.0!'
        };
        break;
      
      case 'goldenTouch':
        this.activeEffects.goldenTouch = true;
        console.log('Golden touch activated: next card will give coins equal to its score contribution');
        
        return {
          success: true,
          message: '✨ Золотое касание: следующая карта даст монеты равные её очкам!'
        };
        break;
      
      case 'chronometer':
        this.activeEffects.chronometer = 2; // Следующие 2 карты дают половину очков
        console.log('Chronometer activated: next 2 cards will give half points');
        
        return {
          success: true,
          message: '⏰ Хронометр: следующие 2 карты дают половину очков!'
        };
        break;
      
      case 'suitMagnet':
        // Для магнита мастей нужно показать выбор масти игроку
        console.log('Suit magnet activated: player should choose a suit');
        
        return {
          success: true,
          requiresSuitChoice: true,
          message: '🧲 Магнит мастей: выберите масть для усиления!'
        };
        break;
      
      case 'destiny':
        // Карта судьбы показывает результат следующей карты
        console.log('Destiny card activated: showing next card outcome');
        return {
          success: true,
          requiresDestinyPreview: true,
          message: '🎯 Карта судьбы: показываю исход следующей карты!'
        };
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

  // Применение магнита мастей - увеличение коэффициента выбранной масти
  applySuitMagnet(chosenSuit) {
    if (!chosenSuit || this.suitMultipliers[chosenSuit] === undefined) {
      return { success: false, message: 'Некорректная масть!' };
    }

    // Увеличиваем коэффициент выбранной масти на 1
    this.suitMultipliers[chosenSuit] += 1;
    
    // Отмечаем эффект как использованный
    this.suitMagnetActive = false;

    const suitNames = {
      '♥': 'Червы',
      '♦': 'Бубны', 
      '♣': 'Трефы',
      '♠': 'Пики'
    };

    return { 
      success: true, 
      message: `🧲 Магнит мастей: ${suitNames[chosenSuit]} +1 (теперь x${this.suitMultipliers[chosenSuit]})!` 
    };
  }

  // Метод для карты судьбы - предпросмотр результата следующей карты
  previewNextCardOutcome(playerHand, currentScore, nextCard) {
    if (!nextCard || nextCard.special) {
      return {
        success: false,
        message: 'Невозможно предсказать исход специальной карты!'
      };
    }

    // Создаем временную руку с добавленной картой
    const tempHand = [...playerHand, { ...nextCard }];
    
    // Рассчитываем базовое значение карты
    let cardValue = 0;
    if (['J', 'Q', 'K'].includes(nextCard.value)) {
      cardValue = 10;
    } else if (nextCard.value === 'A') {
      // Учитываем эффект "Огненный туз"
      if (this.activeEffects.fireAce) {
        cardValue = 12;
      } else {
        cardValue = 11;
      }
    } else {
      cardValue = parseInt(nextCard.value, 10);
    }

    // Применяем мультипликатор масти
    const suitMultiplier = this.getSuitMultiplier(nextCard.suit);
    cardValue = Math.floor(cardValue * suitMultiplier);

    // Применяем эффект хронометра (половина очков)
    if (this.activeEffects.chronometer > 0) {
      cardValue = Math.floor(cardValue / 2);
    }

    // Применяем эффект двойного удара
    if (this.activeEffects.doubleNext) {
      cardValue *= 2;
    }

    // Применяем королевский указ (+2 очка)
    if (this.activeEffects.royalDecree) {
      cardValue += 2;
    }

    const predictedScore = currentScore + cardValue;
    const isOverTarget = predictedScore > this.currentTarget;
    const scoreChange = cardValue;

    return {
      success: true,
      currentScore: currentScore,
      nextCard: nextCard,
      cardValue: cardValue,
      predictedScore: predictedScore,
      scoreChange: scoreChange,
      isOverTarget: isOverTarget,
      suitMultiplier: suitMultiplier,
      message: `🎯 Следующая карта: ${nextCard.value}${nextCard.suit} (${cardValue} очков) → Итого: ${predictedScore} ${isOverTarget ? '⚠️ ПЕРЕБОР!' : '✅'}`
    };
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
      luckySuitActive: null,
      dealerFrozen: false,
      goldenTouch: false,
      chronometer: 0,
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
      case 'luckySuit':
        if (context === 'gameStart') {
          this.applyCardEffect('luckySuit');
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
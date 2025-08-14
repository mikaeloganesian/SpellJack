import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';
import Player from './Player';
import Dealer from './Dealer';
import Controls from './Controls';
import ActualDeckControl from './ActualDeckControl';
import SpecialCardsPanel from './SpecialCardsPanel';
import { useVK } from '../hooks/useVK';

const createPlayerDeck = (customCards = []) => {
  const newDeck = [];
  if (customCards.length > 0) {
    for (let card of customCards) {
      newDeck.push({ value: card.value, suit: card.suit, id: card.id, special: card.special, effect: card.effect });
    }
  } else {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let idCounter = 1000;
    for (let suit of suits) {
      for (let value of values) {
        newDeck.push({ id: idCounter++, value, suit, special: false });
      }
    }
  }
  return shuffleDeck(newDeck);
};

const createDealerDeck = () => {
  const newDeck = [];
  const suits = ['♠', '♥', '♦', '♣'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let idCounter = 2000;
  for (let suit of suits) {
    for (let value of values) {
      newDeck.push({ id: idCounter++, value, suit, special: false });
    }
  }
  return shuffleDeck(newDeck);
};

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const calculateScore = (hand, isPlayerHand = true) => {
  let score = 0;
  let aces = 0;

  for (let card of hand) {
    if (card.special) continue;

    let cardValue = 0;
    if (['J', 'Q', 'K'].includes(card.value)) {
      cardValue = 10;
    } else if (card.value === 'A') {
      aces++;
      // Проверяем эффект "Огненный туз"
      if (gameStore.activeEffects.fireAce) {
        cardValue = 12;
        console.log("Огненный туз активен: " + cardValue);
      } else {
        cardValue = 11;
      }
    } else {
      cardValue = parseInt(card.value, 10);
    }

    // Применяем множитель для масти только для игрока
    if (isPlayerHand) {
      // Используем сохраненный мультипликатор, если он есть, иначе текущий
      const suitMultiplier = card.suitMultiplierSnapshot || gameStore.getSuitMultiplier(card.suit);
      cardValue = Math.floor(cardValue * suitMultiplier);
      
      // Применяем эффект хронометра (половина очков, округление вниз)
      if (card.chronometerEffect) {
        cardValue = Math.floor(cardValue / 2);
        console.log(`⏰ Хронометр: очки карты ${card.value}${card.suit} уменьшены вдвое до ${cardValue}`);
      }
    }

    score += cardValue;
    console.log(`Карта: ${card.value}${card.suit}, Значение: ${cardValue}, Текущий счёт: ${score}`);
  }

  // Применяем королевский указ (+2 очка к каждой карте ПОСЛЕ всех коэффициентов)
  if (isPlayerHand && gameStore.activeEffects.royalDecree) {
    const nonSpecialCards = hand.filter(card => !card.special).length;
    score += nonSpecialCards * 2;
    console.log(`👑 Королевский указ: +${nonSpecialCards * 2} очков (${nonSpecialCards} карт × 2)`);
  }

  // Стандартная логика для тузов: если есть тузы и перебор, 
  // превращаем тузы из 11/12 в 1 очко по одному, пока не уберем перебор или не закончатся тузы
  let acesAsEleven = aces;
  while (acesAsEleven > 0 && score > gameStore.currentTarget) {
    if (gameStore.activeEffects.fireAce) {
      score -= 11; // Один туз становится 1 вместо 12 (12-1=11)
    } else {
      score -= 10; // Один туз становится 1 вместо 11 (11-1=10)
    }
    acesAsEleven--;
  }
  
  // Тузовая броня: если у игрока есть эффект aceArmor и всё ещё перебор, 
  // можем "спасти" еще один туз (но только если у нас есть тузы)
  if (isPlayerHand && gameStore.activeEffects.aceArmor && aces > 0 && score > gameStore.currentTarget) {
    if (gameStore.activeEffects.fireAce) {
      score -= 11; // Дополнительная защита от Тузовой брони (12-1=11)
    } else {
      score -= 10; // Дополнительная защита от Тузовой брони (11-1=10)
    }
  }
  
  return score;
};

const MainGame = observer(() => {
  // VK функциональность
  const { vibrate, shareScore } = useVK();
  
  // dealer deck остаётся локально, колода игрока — только в store
  const [dealerDeck, setDealerDeck] = useState([]);
  const [currentGamePlayerDeck, setCurrentGamePlayerDeck] = useState([]); // Локальная колода для текущей игры
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState('');
  const [isGameActive, setIsGameActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Модалка с текущей колодой
  const [showDeck, setShowDeck] = useState(false);

  // Состояние для карты "Обмен удачи"
  const [isCardSelectionMode, setIsCardSelectionMode] = useState(false);

  // Состояние для карты "Критический выбор"
  const [isCriticalChoiceMode, setIsCriticalChoiceMode] = useState(false);
  const [criticalChoiceCards, setCriticalChoiceCards] = useState([]);

  // Состояние для карты "Картограф"
  const [nextCardSuit, setNextCardSuit] = useState(null);

  // Состояние для карты "Карта предвидения"
  const [foresightCards, setForesightCards] = useState([]);

  // Состояние для выбора масти (магнит мастей)
  const [showSuitChoice, setShowSuitChoice] = useState(false);

  // Состояние для карты судьбы
  const [destinyPreview, setDestinyPreview] = useState(null);
  const [showDestinyPreview, setShowDestinyPreview] = useState(false);

  useEffect(() => {
    if (isGameActive) {
      startNewGame();
    }
  }, [isGameActive]);

  useEffect(() => {
    if (!isPlayerTurn && isGameActive) {
      handleDealerTurn();
    }
  }, [isPlayerTurn, isGameActive]);

  useEffect(() => {
    if (!showDeck) return;
    const onKey = (e) => e.key === 'Escape' && setShowDeck(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDeck]);

  const startNewGame = () => {
    // Сброс эффектов специальных карт
    gameStore.resetGameEffects();
    
    // создаём новую перемешанную колоду игрока из выбранных в редакторе карт (store)
    const shuffledPlayerDeck = createPlayerDeck(gameStore.playerDeck);
    const shuffledDealerDeck = createDealerDeck();

    gameStore.generateNewTarget();
    gameStore.generateSuitMultipliers();

    // Активируем пассивные специальные карты в начале игры
    gameStore.checkPassiveEffects('gameStart');

    if (shuffledPlayerDeck.length < 2 || shuffledDealerDeck.length < 2) {
      setWinner('Not enough cards in the deck to play! Add more cards in Deck Editor.');
      setIsGameActive(false);
      return;
    }

    // раздаём по 2 карты, остаток колоды для текущей игры (НЕ сохраняем в store!)
    const currentGameDeck = [...shuffledPlayerDeck];
    const firstCard = currentGameDeck.pop();
    const secondCard = currentGameDeck.pop();
    
    // Сохраняем мультипликаторы для начальных карт
    if (firstCard && !firstCard.special) {
      firstCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(firstCard.suit);
    }
    if (secondCard && !secondCard.special) {
      secondCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(secondCard.suit);
    }
    
    const newPlayerHand = [firstCard, secondCard];
    const newDealerHand = [shuffledDealerDeck.pop(), shuffledDealerDeck.pop()];

    // Сохраняем остаток колоды только для ТЕКУЩЕЙ игры, НЕ в store
    setCurrentGamePlayerDeck(currentGameDeck);

    setDealerDeck(shuffledDealerDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    
    // Рассчитываем очки для стартовых рук
    const initialPlayerScore = calculateScore(newPlayerHand, true);
    const initialDealerScore = calculateScore(newDealerHand, false);
    
    // Проверяем, не превышает ли стартовая рука игрока цель
    // Если да, то перегенерируем цель, чтобы она была выше на 10-30 очков
    if (initialPlayerScore >= gameStore.currentTarget) {
      const newTarget = initialPlayerScore + Math.floor(Math.random() * 21) + 10; // +10 до +30
      gameStore.currentTarget = newTarget;
      console.log(`⚠️ Стартовая рука (${initialPlayerScore}) превысила цель. Новая цель: ${newTarget}`);
    }
    
    // Аналогично проверяем для дилера (хотя это менее критично)
    if (initialDealerScore >= gameStore.currentTarget) {
      const newTarget = Math.max(initialPlayerScore, initialDealerScore) + Math.floor(Math.random() * 21) + 10;
      gameStore.currentTarget = newTarget;
      console.log(`⚠️ Стартовая рука дилера (${initialDealerScore}) превысила цель. Новая цель: ${newTarget}`);
    }
    
    setPlayerScore(initialPlayerScore);
    setDealerScore(initialDealerScore);
    setIsPlayerTurn(true);
    setWinner('');
    setIsGameActive(true);
    
    // Проверяем эффект "Счастливая семёрка" для начальных карт
    if (gameStore.activeEffects.luckySeven) {
      const initialSevens = newPlayerHand.filter(card => card.value === '7' && !card.special);
      if (initialSevens.length > 0) {
        const coinsEarned = initialSevens.length * 7;
        gameStore.addCoins(coinsEarned);
        console.log(`🍀 Счастливая семёрка! Найдено ${initialSevens.length} семёрок в начальной руке, получено +${coinsEarned} монет!`);
        
        // Показываем уведомление
        setWinner(`🍀 Счастливая семёрка! Начальные семёрки дали +${coinsEarned} монет!`);
        vibrate('success');
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
      }
    }
    
    // Очищаем состояния специальных карт
    setIsCardSelectionMode(false);
    setIsCriticalChoiceMode(false);
    setCriticalChoiceCards([]);
    setNextCardSuit(null);
  };

  const checkWinner = (finalPlayerScore, finalDealerScore) => {
    const target = gameStore.currentTarget;

    let gameResult = '';
    let coinReward = 10; // Базовая награда
    
    // Проверяем эффект "Двойная ставка"
    if (gameStore.activeEffects.doubleBet) {
      coinReward *= 2;
    }
    
    if (finalPlayerScore > target) {
      setWinner('Dealer wins!');
      gameResult = 'loss';
      vibrate('error');
    } else if (finalDealerScore > target) {
      setWinner(gameStore.activeEffects.doubleBet ? 
        `Player wins! +${coinReward} монет (x2 бонус!)` : 
        'Player wins!');
      gameStore.addCoins(coinReward);
      gameResult = 'win';
      vibrate('success');
    } else if (finalPlayerScore === finalDealerScore) {
      setWinner('Push!');
      gameResult = 'draw';
      vibrate('light');
    } else if (finalPlayerScore > finalDealerScore) {
      setWinner(gameStore.activeEffects.doubleBet ? 
        `Player wins! +${coinReward} монет (x2 бонус!)` : 
        'Player wins!');
      gameStore.addCoins(coinReward);
      gameResult = 'win';
      vibrate('success');
    } else {
      setWinner('Dealer wins!');
      gameResult = 'loss';
      vibrate('error');
    }
    
    setIsGameActive(false);
  };

  const drawFromPlayerDeck = () => {
    const deck = [...currentGamePlayerDeck];
    const card = deck.pop() || null;
    setCurrentGamePlayerDeck(deck); // обновляем локальную колоду текущей игры
    return card;
  };

  const handleHit = () => {
    if (!isGameActive || !isPlayerTurn || isAnimating) return;

    setIsAnimating(true);

    // Применяем автоматические эффекты специальных карт при взятии карты
    gameStore.applyAutoEffects();

    setTimeout(() => {
      const newCard = drawFromPlayerDeck();
      if (!newCard) {
        setIsAnimating(false);
        return;
      }

      if (newCard.special) {
        const result = gameStore.applyCardEffect(newCard.effect);
        
        // Если карта требует выбора масти, показываем модальное окно
        if (result && result.requiresSuitChoice) {
          setShowSuitChoice(true);
          // Показываем сообщение пользователю
          if (result.message) {
            console.log(result.message);
          }
        }
        
        // Если карта судьбы, показываем предпросмотр следующей карты
        if (result && result.requiresDestinyPreview) {
          const nextCard = currentGamePlayerDeck[0]; // Следующая карта в колоде
          if (nextCard) {
            const preview = gameStore.previewNextCardOutcome(playerHand, playerScore, nextCard);
            setDestinyPreview(preview);
            setShowDestinyPreview(true);
          }
          // Показываем сообщение пользователю
          if (result.message) {
            console.log(result.message);
          }
        }
      }

      // Сохраняем мультипликатор масти на момент взятия карты
      if (!newCard.special) {
        newCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(newCard.suit);
        
        // Помечаем карту, если она взята под действием хронометра
        if (gameStore.activeEffects.chronometer > 0) {
          newCard.chronometerEffect = true;
        }
      }

      let newPlayerHand = [...playerHand, newCard];
      let newPlayerScore = calculateScore(newPlayerHand, true);


      // ЛОГИКА ДВОЙНОГО УДАРА
      if (gameStore.activeEffects.doubleNext && !newCard.special) {
        console.log('⚡ Двойной удар активирован! Очки карты удвоены.');
        
        // Пересчитываем счет с удвоением последней карты
        const lastCardBonusScore = calculateCardDoubleBonus(newCard);
        newPlayerScore += lastCardBonusScore;
        
        // Показываем уведомление
        setWinner(`⚡ Двойной удар! ${newCard.value}${newCard.suit} дает +${lastCardBonusScore} бонусных очков!`);
        vibrate('success');

        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
        
        // Отключаем эффект после использования
        gameStore.activeEffects.doubleNext = false;
      }

      // ЛОГИКА ЗОЛОТОГО КАСАНИЯ
      if (gameStore.activeEffects.goldenTouch && !newCard.special) {
        console.log('✨ Золотое касание сработало!');
        
        // Вычисляем количество очков, которые добавляет карта (с учетом коэффициентов)
        let cardValue = 0;
        if (['J', 'Q', 'K'].includes(newCard.value)) {
          cardValue = 10;
        } else if (newCard.value === 'A') {
          if (gameStore.activeEffects.fireAce) {
            cardValue = 12;
          } else {
            cardValue = 11;
          }
        } else {
          cardValue = parseInt(newCard.value, 10);
        }

        // Применяем мультипликатор масти (используем сохраненный)
        const suitMultiplier = newCard.suitMultiplierSnapshot || gameStore.getSuitMultiplier(newCard.suit);
        const finalCardValue = Math.floor(cardValue * suitMultiplier);
        
        // Добавляем монеты равные итоговым очкам карты
        gameStore.addCoins(finalCardValue);
        
        // Показываем уведомление
        setWinner(`✨ Золотое касание! ${newCard.value}${newCard.suit} дает +${finalCardValue} монет!`);
        vibrate('success');

        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
        
        // Отключаем эффект после использования
        gameStore.activeEffects.goldenTouch = false;
      }

      // ЛОГИКА СЧАСТЛИВОЙ СЕМЁРКИ
      if (gameStore.activeEffects.luckySeven && newCard.value === '7' && !newCard.special) {
        console.log('🍀 Счастливая семёрка сработала! +7 монет!');
        
        // Добавляем 7 монет
        gameStore.addCoins(7);
        
        // Показываем уведомление
        setWinner(`🍀 Счастливая семёрка! Получено +7 монет за ${newCard.value}${newCard.suit}!`);
        vibrate('success');

        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
      }


      // ЛОГИКА ЩИТА - проверяем ПОСЛЕ взятия карты
      if (newPlayerScore > gameStore.currentTarget && gameStore.activeEffects.shield) {
        console.log('🛡️ Щит сработал! Сбрасываем последнюю карту.');
        newPlayerHand.pop(); // Убираем последнюю взятую карту
        newPlayerScore = calculateScore(newPlayerHand, true); // Пересчитываем счет
        gameStore.activeEffects.shield = false; // Отключаем щит
        
        // Показываем уведомление о срабатывании щита
        setWinner('🛡️ Щит сработал! Последняя карта сброшена. Игра продолжается...');
        vibrate('success'); // Тактильная обратная связь
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
        
        // Игра ПРОДОЛЖАЕТСЯ - игрок может взять еще карты
        setPlayerHand(newPlayerHand);
        setPlayerScore(newPlayerScore);
        setIsAnimating(false);
        return; // Выходим, не проверяя условия завершения
      }

      if (gameStore.activeEffects.extraCard) {
        const extraCard = drawFromPlayerDeck();
        if (extraCard) {
          if (extraCard.special) gameStore.applyCardEffect(extraCard.effect);
          newPlayerHand.push(extraCard);
          newPlayerScore = calculateScore(newPlayerHand, true);
        }
        gameStore.activeEffects.extraCard = false;
      }

      // ЛОГИКА ХРОНОМЕТРА - уменьшение счётчика и показ уведомления
      if (gameStore.activeEffects.chronometer > 0 && !newCard.special) {
        gameStore.activeEffects.chronometer--;
        console.log(`⏰ Хронометр: осталось ${gameStore.activeEffects.chronometer} карт с половинными очками`);
        
        if (gameStore.activeEffects.chronometer === 0) {
          // Показываем уведомление о завершении эффекта
          setWinner('⏰ Хронометр отключён! Карты снова дают полные очки.');
          vibrate('light');
          
          // Убираем уведомление через 2 секунды
          setTimeout(() => {
            setWinner('');
          }, 2000);
        }
      }

      setPlayerHand(newPlayerHand);
      setPlayerScore(newPlayerScore);
      setIsAnimating(false);

      if (newPlayerScore >= gameStore.currentTarget) {
        setIsPlayerTurn(false);
        if (newPlayerScore === gameStore.currentTarget) {
          let perfectReward = 20; // Базовая награда за идеальное попадание
          
          // Проверяем эффект "Двойная ставка"
          if (gameStore.activeEffects.doubleBet) {
            perfectReward *= 2;
          }
          
          setWinner(gameStore.activeEffects.doubleBet ? 
            `Perfect! Player wins! +${perfectReward} монет (x2 бонус!)` : 
            'Perfect! Player wins!');
          gameStore.addCoins(perfectReward);
          setIsGameActive(false);
        }
      }
    }, 500);
  };

  const handleStand = () => {
    if (!isGameActive || !isPlayerTurn) return;
    setIsPlayerTurn(false);
  };

  const handleDealerTurn = () => {
    let newDealerDeck = [...dealerDeck];
    let newDealerHand = [...dealerHand];
    let newDealerScore = calculateScore(newDealerHand, false);

    if (gameStore.activeEffects.removeDealerCard) {
      if (newDealerHand.length > 0) {
        newDealerHand.pop();
        newDealerScore = calculateScore(newDealerHand, false);
      }
      gameStore.activeEffects.removeDealerCard = false;
    }

    const target = gameStore.currentTarget;
    let dealerThreshold = target <= 30 ? 17 : Math.floor(target * 0.85);

    // Обычная логика дилера - берет карты до нужного порога
    while (newDealerScore < dealerThreshold && newDealerScore < target && newDealerDeck.length > 0) {
      newDealerHand.push(newDealerDeck.pop());
      newDealerScore = calculateScore(newDealerHand, false);
    }

    // КАРТА-ЛОВУШКА: принуждает дилера взять еще одну карту после обычной логики
    if (gameStore.activeEffects.dealerTrap && newDealerDeck.length > 0) {
      console.log('🪤 Карта-ловушка сработала! Дилер вынужден взять еще одну карту.');
      
      // Дилер принудительно берет еще одну карту
      newDealerHand.push(newDealerDeck.pop());
      newDealerScore = calculateScore(newDealerHand, false);
      
      // Показываем уведомление
      setWinner('🪤 Карта-ловушка! Дилер вынужден взять дополнительную карту...');
      vibrate('success');
      
      // Отключаем эффект после использования (через MobX action)
      gameStore.disableDealerTrap();
      
      // Обновляем состояние СНАЧАЛА
      setDealerDeck(newDealerDeck);
      setDealerHand(newDealerHand);
      setDealerScore(newDealerScore);
      
      // Показываем результат только через 3 секунды
      setTimeout(() => {
        setWinner(''); // Убираем уведомление о ловушке
        checkWinner(playerScore, newDealerScore); // Показываем результат игры
      }, 3000);
      
      return; // Выходим, чтобы не вызывать checkWinner сразу
    }

    setDealerDeck(newDealerDeck);
    setDealerHand(newDealerHand);
    setDealerScore(newDealerScore);

    checkWinner(playerScore, newDealerScore);
  };



  // Функция для расчета бонуса от двойного удара
  const calculateCardDoubleBonus = (card) => {
    let baseValue = 0;
    
    if (['J', 'Q', 'K'].includes(card.value)) {
      baseValue = 10;
    } else if (card.value === 'A') {
      // Учитываем эффект "Огненный туз"
      if (gameStore.activeEffects.fireAce) {
        baseValue = 12; // Огненный туз = 12 очков
      } else {
        baseValue = 11; // Обычный туз = 11 очков
      }
    } else {
      baseValue = parseInt(card.value, 10);
    }

    // Применяем множитель масти (используем сохраненный мультипликатор)
    const suitMultiplier = card.suitMultiplierSnapshot || gameStore.getSuitMultiplier(card.suit);
    const finalCardValue = Math.floor(baseValue * suitMultiplier);
    
    // Возвращаем столько же очков как бонус (удваивание)
    return finalCardValue;
  };

  // Функция для обмена карты (карта "Обмен удачи")
  const handleCardSwap = (cardIndex) => {
    if (!isCardSelectionMode || !isGameActive || currentGamePlayerDeck.length === 0) return;

    const newPlayerHand = [...playerHand];
    const newPlayerDeck = [...currentGamePlayerDeck];
    
    // Получаем карту, которую игрок хочет заменить
    const cardToSwap = newPlayerHand[cardIndex];
    
    // Получаем верхнюю карту из колоды
    const newCard = newPlayerDeck.pop();
    
    if (!newCard) {
      setWinner('Колода пуста! Обмен невозможен.');
      setIsCardSelectionMode(false);
      setTimeout(() => setWinner(''), 2000);
      return;
    }

    // Заменяем карту в руке
    newPlayerHand[cardIndex] = newCard;
    
    // Сохраняем мультипликатор масти для новой карты
    if (!newCard.special) {
      newCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(newCard.suit);
    }
    
    // Возвращаем старую карту обратно в колоду (в конец)
    newPlayerDeck.unshift(cardToSwap);
    
    // Перемешиваем колоду
    const shuffledDeck = shuffleDeck(newPlayerDeck);
    
    // Обновляем состояние
    setPlayerHand(newPlayerHand);
    setCurrentGamePlayerDeck(shuffledDeck);
    setPlayerScore(calculateScore(newPlayerHand, true));
    
    // Проверяем эффект "Золотое касание" для новой карты
    let goldenTouchCoins = 0;
    if (gameStore.activeEffects.goldenTouch && !newCard.special) {
      console.log('✨ Золотое касание сработало при обмене!');
      
      // Вычисляем количество очков, которые добавляет карта (с учетом коэффициентов)
      let cardValue = 0;
      if (['J', 'Q', 'K'].includes(newCard.value)) {
        cardValue = 10;
      } else if (newCard.value === 'A') {
        if (gameStore.activeEffects.fireAce) {
          cardValue = 12;
        } else {
          cardValue = 11;
        }
      } else {
        cardValue = parseInt(newCard.value, 10);
      }

      // Применяем мультипликатор масти (используем сохраненный)
      const suitMultiplier = newCard.suitMultiplierSnapshot || gameStore.getSuitMultiplier(newCard.suit);
      const finalCardValue = Math.floor(cardValue * suitMultiplier);
      goldenTouchCoins = finalCardValue;
      
      // Добавляем монеты равные итоговым очкам карты
      gameStore.addCoins(finalCardValue);
      
      // Отключаем эффект после использования
      gameStore.activeEffects.goldenTouch = false;
    }
    
    // Проверяем эффект "Счастливая семёрка" для новой карты
    if (gameStore.activeEffects.luckySeven && newCard.value === '7' && !newCard.special) {
      gameStore.addCoins(7);
      console.log('🍀 Счастливая семёрка сработала при обмене! +7 монет!');
    }
    
    // Показываем уведомление
    let message = `🔄 Обмен удачи! ${cardToSwap.value}${cardToSwap.suit} → ${newCard.value}${newCard.suit}`;
    if (gameStore.activeEffects.luckySeven && newCard.value === '7' && !newCard.special) {
      message += ' (+7 монет за семёрку!)';
    }
    if (goldenTouchCoins > 0) {
      message += ` (✨ +${goldenTouchCoins} монет!)`;
    }
    setWinner(message);
    vibrate('success');
    
    // Убираем уведомление и выходим из режима выбора
    setTimeout(() => {
      setWinner('');
    }, 2500);
    
    setIsCardSelectionMode(false);
    
    // Отключаем эффект
    gameStore.disableSwapCard();
  };

  // Функция для активации режима выбора карты
  const handleCardSwapActivate = () => {
    setIsCardSelectionMode(true);
  };

  // Функция для сброса всех карт и получения двух новых (карта "Сброс напряжения")
  const handleResetHand = () => {
    if (currentGamePlayerDeck.length < 2) {
      setWinner('❌ Недостаточно карт в колоде для сброса!');
      setTimeout(() => setWinner(''), 2000);
      return;
    }

    // Сбрасываем все карты из руки (не возвращаем в колоду - они уходят "в дискард")
    const newPlayerDeck = [...currentGamePlayerDeck];
    
    // Берем две новые карты
    const newHand = [];
    const firstCard = newPlayerDeck.pop();
    const secondCard = newPlayerDeck.pop();
    
    // Сохраняем мультипликаторы для новых карт
    if (firstCard && !firstCard.special) {
      firstCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(firstCard.suit);
    }
    if (secondCard && !secondCard.special) {
      secondCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(secondCard.suit);
    }
    
    newHand.push(firstCard);
    newHand.push(secondCard);
    
    // Обновляем состояние
    setPlayerHand(newHand);
    setCurrentGamePlayerDeck(newPlayerDeck);
    setPlayerScore(calculateScore(newHand, true));
    
    // Проверяем эффект "Счастливая семёрка" для новых карт
    if (gameStore.activeEffects.luckySeven) {
      const newSevens = newHand.filter(card => card.value === '7' && !card.special);
      if (newSevens.length > 0) {
        const coinsEarned = newSevens.length * 7;
        gameStore.addCoins(coinsEarned);
        console.log(`🍀 Счастливая семёрка! Найдено ${newSevens.length} семёрок после сброса, получено +${coinsEarned} монет!`);
      }
    }
    
    // Показываем уведомление
    let message = `💥 Сброс напряжения! Новая рука получена!`;
    if (gameStore.activeEffects.luckySeven) {
      const newSevens = newHand.filter(card => card.value === '7' && !card.special);
      if (newSevens.length > 0) {
        const coinsEarned = newSevens.length * 7;
        message += ` (+${coinsEarned} монет за семёрки!)`;
      }
    }
    setWinner(message);
    vibrate('success');
    
    // Убираем уведомление
    setTimeout(() => {
      setWinner('');
    }, 2500);
  };

  // Функция для активации критического выбора (карта "Критический выбор")
  const handleCriticalChoiceActivate = () => {
    if (currentGamePlayerDeck.length < 3) {
      setWinner('❌ Недостаточно карт для критического выбора!');
      setTimeout(() => setWinner(''), 2000);
      return;
    }

    // Берем 3 верхние карты из колоды (не удаляя их пока)
    const topCards = currentGamePlayerDeck.slice(-3);
    setCriticalChoiceCards(topCards);
    setIsCriticalChoiceMode(true);
    
    setWinner('🔍 Критический выбор: выберите одну из трех карт!');
    
  };

  // Функция для выбора карты в критическом выборе
  const handleCriticalCardChoice = (chosenCardIndex) => {
    const chosenCard = criticalChoiceCards[chosenCardIndex];
    const newPlayerDeck = [...currentGamePlayerDeck];
    
    // Удаляем все 3 карты из колоды
    newPlayerDeck.splice(-3, 3);
    
    // Добавляем выбранную карту в руку
    // Сохраняем мультипликатор масти для выбранной карты
    if (!chosenCard.special) {
      chosenCard.suitMultiplierSnapshot = gameStore.getSuitMultiplier(chosenCard.suit);
    }
    
    const newPlayerHand = [...playerHand, chosenCard];
    const newPlayerScore = calculateScore(newPlayerHand, true);
    
    // Обновляем состояние
    setPlayerHand(newPlayerHand);
    setCurrentGamePlayerDeck(newPlayerDeck);
    setPlayerScore(newPlayerScore);
    
    // Проверяем эффект "Золотое касание" для выбранной карты
    if (gameStore.activeEffects.goldenTouch && !chosenCard.special) {
      console.log('✨ Золотое касание сработало при критическом выборе!');
      
      // Вычисляем количество очков, которые добавляет карта (с учетом коэффициентов)
      let cardValue = 0;
      if (['J', 'Q', 'K'].includes(chosenCard.value)) {
        cardValue = 10;
      } else if (chosenCard.value === 'A') {
        if (gameStore.activeEffects.fireAce) {
          cardValue = 12;
        } else {
          cardValue = 11;
        }
      } else {
        cardValue = parseInt(chosenCard.value, 10);
      }

      // Применяем мультипликатор масти (используем сохраненный)
      const suitMultiplier = chosenCard.suitMultiplierSnapshot || gameStore.getSuitMultiplier(chosenCard.suit);
      const finalCardValue = Math.floor(cardValue * suitMultiplier);
      
      // Добавляем монеты равные итоговым очкам карты
      gameStore.addCoins(finalCardValue);
      
      // Отключаем эффект после использования
      gameStore.activeEffects.goldenTouch = false;
      
      console.log(`✨ Золотое касание: получено ${finalCardValue} монет за ${chosenCard.value}${chosenCard.suit}!`);
    }
    
    // Проверяем эффект "Счастливая семёрка" для выбранной карты
    if (gameStore.activeEffects.luckySeven && chosenCard.value === '7' && !chosenCard.special) {
      gameStore.addCoins(7);
      console.log('🍀 Счастливая семёрка сработала при критическом выборе! +7 монет!');
    }
    
    // Сбрасываем состояние критического выбора
    setIsCriticalChoiceMode(false);
    setCriticalChoiceCards([]);

    setWinner('');
    
    // Проверяем на перебор или победу
    setTimeout(() => {
      // Проверяем на перебор или победу
      if (newPlayerScore > gameStore.currentTarget) {
        // Проверяем, активен ли щит перегруза
        if (gameStore.activeEffects.shield) {
          gameStore.disableShield(); // Отключаем щит
          setWinner(`🛡️ Щит перегруза сработал! Перебор предотвращён (${newPlayerScore})`);
          vibrate('success');
          setTimeout(() => {
            setWinner('');
          }, 2500);
        } else {
          // Обычный перебор
          setIsGameActive(false);
          setIsPlayerTurn(false);
          checkWinner(newPlayerScore, dealerScore);
          return;
        }
      } else {
        // Показываем уведомление о выборе карты
        let message = `🔍 Критический выбор! Получена: ${chosenCard.value}${chosenCard.suit}`;
        if (gameStore.activeEffects.luckySeven && chosenCard.value === '7' && !chosenCard.special) {
          message += ' (+7 монет за семёрку!)';
        }
        setWinner(message);
        vibrate('success');
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
      }
    }, 100); // Небольшая задержка для корректного обновления
  };

  // Функция для активации картографа (карта "Картограф")
  const handleCartographerActivate = () => {
    if (currentGamePlayerDeck.length === 0) {
      setWinner('❌ В колоде нет карт!');
      setTimeout(() => setWinner(''), 2000);
      return;
    }

    // Получаем следующую карту (последнюю в массиве)
    const nextCard = currentGamePlayerDeck[currentGamePlayerDeck.length - 1];
    setNextCardSuit(nextCard.suit);
    
    setWinner(`🗺️ Картограф: следующая карта масти ${nextCard.suit}`);
    vibrate('success');
    
    // Убираем информацию через 5 секунд
    setTimeout(() => {
      setWinner('');
      setNextCardSuit(null);
    }, 5000);
  };

  // Функция для активации листопада (карта "Листопад")
  const handleLeafFallActivate = () => {
    if (playerHand.length === 0) {
      setWinner('❌ Нет карт в руке для сброса!');
      setTimeout(() => setWinner(''), 2000);
      return;
    }

    // Сбрасываем случайную карту из руки
    const randomIndex = Math.floor(Math.random() * playerHand.length);
    const droppedCard = playerHand[randomIndex];
    const newHand = playerHand.filter((_, index) => index !== randomIndex);
    
    setPlayerHand(newHand);
    setPlayerScore(calculateScore(newHand, true));
    
    // Даём +3 монеты
    gameStore.addCoins(3);
    
    setWinner(`🍃 Листопад: сброшена ${droppedCard.value}${droppedCard.suit}, +3 💰`);
    vibrate('success');
    
    // Убираем сообщение через 3 секунды
    setTimeout(() => {
      setWinner('');
    }, 3000);
  };

  // Функция для активации магнита мастей
  const handleSuitMagnetActivate = () => {
    setShowSuitChoice(true);
  };

  // Функция для активации карты судьбы
  const handleDestinyActivate = () => {
    // Берем последнюю карту из колоды (так как drawFromPlayerDeck использует pop())
    const nextCard = currentGamePlayerDeck[currentGamePlayerDeck.length - 1];
    if (nextCard) {
      const preview = gameStore.previewNextCardOutcome(playerHand, playerScore, nextCard);
      setDestinyPreview(preview);
      setShowDestinyPreview(true);
    } else {
      setWinner('🎯 В колоде нет карт для предсказания!');
      setTimeout(() => setWinner(''), 2000);
    }
  };

  // Функция для закрытия предпросмотра карты судьбы
  const handleDestinyPreviewClose = () => {
    setShowDestinyPreview(false);
    setDestinyPreview(null);
  };

  // Функция для выбора масти для магнита мастей
  const handleSuitChoice = (suitSymbol) => {
    const result = gameStore.applySuitMagnet(suitSymbol);
    if (result.success) {
      setWinner(result.message);
      setTimeout(() => setWinner(''), 3000);
    } else {
      setWinner(result.message);
      setTimeout(() => setWinner(''), 2000);
    }
    
    setShowSuitChoice(false);
  };

  // Функция для активации карты предвидения
  const handleForesightActivate = () => {
    if (currentGamePlayerDeck.length < 2) {
      setWinner('🔮 В колоде мало карт для предвидения!');
      setTimeout(() => setWinner(''), 2000);
      return;
    }

    const deckLength = currentGamePlayerDeck.length;
    const nextTwoCards = [
      currentGamePlayerDeck[deckLength - 1],
      currentGamePlayerDeck[deckLength - 2]
    ];
    
    setForesightCards(nextTwoCards);
    
    setWinner('🔮 Предвидение: показаны следующие 2 карты в колоде!');
    vibrate('light');
    
    // Убираем сообщение быстрее, чем карты
    setTimeout(() => {
      setWinner('');
    }, 2000); // Сообщение исчезает через 2 сек
    
    setTimeout(() => {
      setForesightCards([]);
    }, 5000); // Карты исчезают через 5 сек
  };

  return (
    <div className="main-game">
      <h1 className="header">SpellJack</h1>

      {/* Модалка с текущей колодой */}
      <ActualDeckControl 
        visible={showDeck} 
        onClose={() => setShowDeck(false)} 
        deck={currentGamePlayerDeck}
      />

      <div className="game-info">
        <div className="game-target">
          <h3>Target Score: {gameStore.currentTarget}</h3>
          {gameStore.activeEffects.doubleBet && (
            <div className="double-bet-indicator">
              💰 Двойная ставка активна! x2 награда за победу!
            </div>
          )}
        </div>
        <div className="suit-multipliers">
          <h4>Suit Multipliers:</h4>
          <div className="multipliers-table">
            <div className={`multiplier-item ${gameStore.activeEffects.luckySuitActive === '♠' ? 'lucky-suit-boosted' : ''}`}>
              <span className="suit-symbol">♠</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♠')}</span>
            </div>
            <div className={`multiplier-item ${gameStore.activeEffects.luckySuitActive === '♥' ? 'lucky-suit-boosted' : ''}`}>
              <span className="suit-symbol red-suit">♥</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♥')}</span>
            </div>
            <div className={`multiplier-item ${gameStore.activeEffects.luckySuitActive === '♦' ? 'lucky-suit-boosted' : ''}`}>
              <span className="suit-symbol red-suit">♦</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♦')}</span>
            </div>
            <div className={`multiplier-item ${gameStore.activeEffects.luckySuitActive === '♣' ? 'lucky-suit-boosted' : ''}`}>
              <span className="suit-symbol">♣</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♣')}</span>
            </div>
          </div>
          
          {/* Индикатор стабилизатора */}
          {gameStore.activeEffects.stabilizer && (
            <div className="stabilizer-indicator">
              ⚖️ Стабилизатор активен - коэффициенты x1.0
            </div>
          )}
          
          {/* Индикатор золотого касания */}
          {gameStore.activeEffects.goldenTouch && (
            <div className="golden-touch-indicator">
              ✨ Золотое касание готово - следующая карта даст монеты!
            </div>
          )}
        </div>
        
      </div>

      <Dealer
        hand={dealerHand}
        score={dealerScore}
        showFirstCard={isPlayerTurn && !gameStore.activeEffects.revealDealerCard}
      />

      {/* Панель критического выбора */}
      {isCriticalChoiceMode && (
        <div className="critical-choice-panel">
          <h3>🔍 Критический выбор - выберите одну карту:</h3>
          <div className="critical-choice-cards">
            {criticalChoiceCards.map((card, index) => {
              const isRed = card.suit === '♥' || card.suit === '♦';
              return (
                <div 
                  key={index}
                  className={`card critical-choice-card ${isRed ? 'red-card' : ''}`}
                  onClick={() => handleCriticalCardChoice(index)}
                >
                  <div className="card-value">{card.value}</div>
                  <div className="card-suit">{card.suit}</div>
                  <div className="choice-indicator">
                    Выбрать
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Панель выбора масти для магнита мастей */}
      {showSuitChoice && (
        <div className="suit-choice-panel">
          <h3>🧲 Магнит мастей - выберите масть для усиления:</h3>
          <div className="suit-choice-options">
            {['♥', '♦', '♣', '♠'].map((suit) => {
              const isRed = suit === '♥' || suit === '♦';
              return (
                <div 
                  key={suit}
                  className={`suit-choice-option ${isRed ? 'red-suit' : 'black-suit'}`}
                  onClick={() => handleSuitChoice(suit)}
                >
                  <div className="suit-symbol">{suit}</div>
                  <div className="suit-name">
                    {suit === '♥' ? 'Червы' : 
                     suit === '♦' ? 'Бубны' :
                     suit === '♣' ? 'Трефы' : 'Пики'}
                  </div>
                  <div className="current-multiplier">
                    x{gameStore.getSuitMultiplier(suit)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Панель предсказания карты судьбы */}
      {showDestinyPreview && destinyPreview && (
        <div className="destiny-preview-panel">
          <h3>🔮 Карта судьбы - предсказание будущего:</h3>
          <div className="destiny-preview-content">
            <div className="predicted-card">
              <div className={`card ${(destinyPreview.nextCard.suit === '♥' || destinyPreview.nextCard.suit === '♦') ? 'red-card' : ''}`}>
                <div className="card-value">{destinyPreview.nextCard.value}</div>
                <div className="card-suit">{destinyPreview.nextCard.suit}</div>
              </div>
              <div className="card-info">
                <div>Следующая карта</div>
                <div className="card-name">{destinyPreview.nextCard.name}</div>
              </div>
            </div>
            <div className="prediction-results">
              <div className="prediction-item">
                <span>Текущие очки:</span>
                <span className="current-score">{destinyPreview.currentScore}</span>
              </div>
              <div className="prediction-item main-prediction">
                <span>Предсказанные очки:</span>
                <span className="predicted-score">{destinyPreview.predictedScore}</span>
              </div>
              <div className="prediction-item">
                <span>Изменение:</span>
                <span className={`score-change ${destinyPreview.scoreChange >= 0 ? 'positive' : 'negative'}`}>
                  {destinyPreview.scoreChange >= 0 ? '+' : ''}{destinyPreview.scoreChange}
                </span>
              </div>
            </div>
            <div className="destiny-actions">
              <button className="destiny-close-btn" onClick={handleDestinyPreviewClose}>
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="game-area">
        {/* СТОПКА КАРТ — клик открывает модалку */}
        <div
          className={`deck-stack ${isAnimating ? 'animate-deal' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Show current deck"
          onClick={() => setShowDeck(true)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setShowDeck(true)}
          title="Показать текущую колоду"
          style={{ cursor: 'pointer' }}
        >
          <div className="card back-card">?</div>
          {nextCardSuit && (
            <div className="next-card-suit-indicator">
              🗺️ {nextCardSuit}
            </div>
          )}
        </div>

        {winner && (
          <div className="winner-section">
            <h2 className="winner-message">{winner}</h2>
            {(winner.includes('Player wins!')) && (
              <button 
                className="share-button"
                onClick={() => shareScore(playerScore)}
                title="Поделиться результатом"
              >
                📤 Поделиться
              </button>
            )}
          </div>
        )}

        {/* Отображение карт предвидения */}
        {foresightCards.length > 0 && (
          <div className="foresight-section">
            <h3>🔮 Следующие карты в колоде:</h3>
            <div className="foresight-cards">
              {foresightCards.map((card, index) => {
                const isRed = card.suit === '♥' || card.suit === '♦';
                return (
                  <div key={`foresight-${index}`} className={`foresight-card ${isRed ? 'red-card' : ''}`}>
                    <div className="card-value">{card.value}</div>
                    <div className="card-suit">{card.suit}</div>
                    <div className="card-order">{index + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Player 
          hand={playerHand} 
          score={playerScore} 
          isCardSelectionMode={isCardSelectionMode}
          onCardSwap={handleCardSwap}
        />
      </div>

      {/* Панель специальных карт */}
      <SpecialCardsPanel 
        store={gameStore} 
        onCardSwapActivate={handleCardSwapActivate}
        onResetHand={handleResetHand}
        onCriticalChoiceActivate={handleCriticalChoiceActivate}
        onCartographerActivate={handleCartographerActivate}
        onLeafFallActivate={handleLeafFallActivate}
        onForesightActivate={handleForesightActivate}
        onSuitMagnetActivate={handleSuitMagnetActivate}
        onDestinyActivate={handleDestinyActivate}
        isBlocked={isCriticalChoiceMode}
      />

      <Controls
        onHit={handleHit}
        onStand={handleStand}
        onNewGame={startNewGame}
        isGameActive={isGameActive && isPlayerTurn && !isCriticalChoiceMode}
      />
    </div>
  );
});

export default MainGame;
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
      const suitMultiplier = gameStore.getSuitMultiplier(card.suit);
      cardValue = Math.floor(cardValue * suitMultiplier);
    }

    score += cardValue;
    console.log(`Карта: ${card.value}${card.suit}, Значение: ${cardValue}, Текущий счёт: ${score}`);
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
  const { vibrate, shareScore, sendStats } = useVK();
  
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

  // модалка с текущей колодой
  const [showDeck, setShowDeck] = useState(false);

  // Состояние для карты "Обмен удачи"
  const [isCardSelectionMode, setIsCardSelectionMode] = useState(false);

  // Состояние для карты "Критический выбор"
  const [isCriticalChoiceMode, setIsCriticalChoiceMode] = useState(false);
  const [criticalChoiceCards, setCriticalChoiceCards] = useState([]);

  // Состояние для карты "Картограф"
  const [nextCardSuit, setNextCardSuit] = useState(null);

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
    const newPlayerHand = [currentGameDeck.pop(), currentGameDeck.pop()];
    const newDealerHand = [shuffledDealerDeck.pop(), shuffledDealerDeck.pop()];

    // Сохраняем остаток колоды только для ТЕКУЩЕЙ игры, НЕ в store
    setCurrentGamePlayerDeck(currentGameDeck);

    setDealerDeck(shuffledDealerDeck);
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setPlayerScore(calculateScore(newPlayerHand, true));
    setDealerScore(calculateScore(newDealerHand, false));
    setIsPlayerTurn(true);
    setWinner('');
    setIsGameActive(true);
    
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
    
    // Отправляем статистику в VK
    sendStats('game_finished', {
      result: gameResult,
      player_score: finalPlayerScore,
      dealer_score: finalDealerScore,
      target: target
    });
    
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
        gameStore.applyCardEffect(newCard.effect);
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
      // ✅ ИСПРАВЛЕНИЕ: Учитываем эффект "Огненный туз"
      if (gameStore.activeEffects.fireAce) {
        baseValue = 12; // Огненный туз = 12 очков
      } else {
        baseValue = 11; // Обычный туз = 11 очков
      }
    } else {
      baseValue = parseInt(card.value, 10);
    }

    // Применяем множитель масти
    const suitMultiplier = gameStore.getSuitMultiplier(card.suit);
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
    
    // Возвращаем старую карту обратно в колоду (в конец)
    newPlayerDeck.unshift(cardToSwap);
    
    // Перемешиваем колоду
    const shuffledDeck = shuffleDeck(newPlayerDeck);
    
    // Обновляем состояние
    setPlayerHand(newPlayerHand);
    setCurrentGamePlayerDeck(shuffledDeck);
    setPlayerScore(calculateScore(newPlayerHand, true));
    
    // Показываем уведомление
    setWinner(`🔄 Обмен удачи! ${cardToSwap.value}${cardToSwap.suit} → ${newCard.value}${newCard.suit}`);
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
    newHand.push(newPlayerDeck.pop());
    newHand.push(newPlayerDeck.pop());
    
    // Обновляем состояние
    setPlayerHand(newHand);
    setCurrentGamePlayerDeck(newPlayerDeck);
    setPlayerScore(calculateScore(newHand, true));
    
    // Показываем уведомление
    setWinner(`💥 Сброс напряжения! Новая рука получена!`);
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
    const newPlayerHand = [...playerHand, chosenCard];
    const newPlayerScore = calculateScore(newPlayerHand, true);
    
    // Обновляем состояние
    setPlayerHand(newPlayerHand);
    setCurrentGamePlayerDeck(newPlayerDeck);
    setPlayerScore(newPlayerScore);
    
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
        setWinner(`🔍 Критический выбор! Получена: ${chosenCard.value}${chosenCard.suit}`);
        vibrate('success');
        
        // Убираем уведомление через 3 секунды
        setTimeout(() => {
          setWinner('');
        }, 3000);
      }
    }, 100); // Небольшая задержка для корректного обновления
  };

  // ✅ Функция для активации картографа (карта "Картограф")
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

  return (
    <div className="main-game">
      <h1 className="header">Blackjack</h1>

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
            <div className="multiplier-item">
              <span className="suit-symbol">♠</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♠')}</span>
            </div>
            <div className="multiplier-item">
              <span className="suit-symbol red-suit">♥</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♥')}</span>
            </div>
            <div className="multiplier-item">
              <span className="suit-symbol red-suit">♦</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♦')}</span>
            </div>
            <div className="multiplier-item">
              <span className="suit-symbol">♣</span>
              <span className="multiplier-value">x{gameStore.getSuitMultiplier('♣')}</span>
            </div>
          </div>
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
import { gameStore } from '../Store';
import specialCards from '../data/specialCards';

// Тестирование системы специальных карт
console.log('=== Тестирование системы специальных карт ===');

// 1. Проверяем, что специальные карты загружены
console.log('Доступно специальных карт:', specialCards.length);
console.log('Первые 3 карты:', specialCards.slice(0, 3));

// 2. Симулируем покупку специальной карты
const testCard = specialCards[0]; // Открытый взгляд
gameStore.coins = 1000; // Добавляем монеты для тестирования

console.log('\n=== Покупка карты ===');
console.log('Монеты до покупки:', gameStore.coins);
console.log('Покупаем карту:', testCard.id, 'за', testCard.cost);

gameStore.buyCard(testCard);

console.log('Монеты после покупки:', gameStore.coins);
console.log('Карт в коллекции:', gameStore.playerOwnedCards.length);

// 3. Добавляем карту в активную колоду
console.log('\n=== Добавление в активную колоду ===');
const success = gameStore.addSpecialCardToDeck(testCard);
console.log('Успешно добавлено:', success);
console.log('Активных специальных карт:', gameStore.activeSpecialCards.length);

// 4. Тестируем активацию карты
console.log('\n=== Активация карты ===');
console.log('Можно активировать:', gameStore.canActivateCard(testCard.id));
const activated = gameStore.activateSpecialCard(testCard.id);
console.log('Карта активирована:', activated);
console.log('Использованные эффекты:', gameStore.usedSpecialEffects);

// 5. Проверяем эффекты
console.log('\n=== Состояние эффектов ===');
console.log('Активные эффекты:', gameStore.activeEffects);

// 6. Тестируем ручную активацию
console.log('\n=== Ручная активация ===');
const manualCards = gameStore.getManualActivationCards();
console.log('Карты для ручной активации:', manualCards.length);

// 7. Сброс эффектов
console.log('\n=== Сброс эффектов ===');
gameStore.resetGameEffects();
console.log('После сброса - использованные эффекты:', gameStore.usedSpecialEffects);
console.log('После сброса - активные эффекты:', gameStore.activeEffects);

export default {
  testSpecialCards: () => {
    console.log('Тестирование завершено. Проверьте консоль для результатов.');
  }
};

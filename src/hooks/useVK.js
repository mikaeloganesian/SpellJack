import { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';

export const useVK = () => {
  const [user, setUser] = useState(null);
  const [isVKApp, setIsVKApp] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение в VK
    const checkVKEnvironment = async () => {
      try {
        const userInfo = await bridge.send('VKWebAppGetUserInfo');
        setUser(userInfo);
        setIsVKApp(true);
      } catch (error) {
        console.log('Приложение запущено не в VK:', error);
        setIsVKApp(false);
      }
    };

    checkVKEnvironment();
  }, []);

  

  // Функция для вибрации
  const vibrate = async (type = 'light') => {
    try {
      await bridge.send('VKWebAppTapticNotificationOccurred', { type });
    } catch (error) {
      console.error('Ошибка вибрации:', error);
    }
  };

  // Функция для публикации рекорда на стену
  const shareScore = async (score) => {
    try {
      // Отправка в личные сообщения с коротким текстом (до 100 символов)
      const result = await bridge.send('VKWebAppShare', {
        link: 'https://vk.com/app54024852',
        text: `Набрал ${score} очков в SpellJack! 🃏` // Короткий текст до 100 символов
      });
      
      console.log('Share result:', result);
      
    } catch (shareError) {
      console.error('Ошибка отправки в ЛС:', shareError);
      // Fallback для режима разработки
      alert(`🎉 Результат: ${score} очков!\n📤 Функция "Поделиться" будет доступна в продакшене.`);
    }
  };

  return {
    user,
    isVKApp,
    vibrate,
    shareScore
  };
};

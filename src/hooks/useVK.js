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
      await bridge.send('VKWebAppShowWallPostBox', {
        message: `Я набрал ${score} очков в SpellJack! 🃏 Попробуй побить мой рекорд!`,
        attachments: 'https://vk.com/app54024852' // Замените на ваш ID приложения
      });
    } catch (error) {
      console.error('Ошибка публикации:', error);
    }
  };

  return {
    user,
    isVKApp,
    vibrate,
    shareScore
  };
};

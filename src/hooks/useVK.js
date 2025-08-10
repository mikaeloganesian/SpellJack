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

  // Функция для показа рекламы
  const showAd = async () => {
    try {
      await bridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' });
      return true;
    } catch (error) {
      console.error('Ошибка показа рекламы:', error);
      return false;
    }
  };

  // Функция для отправки статистики
  const sendStats = async (event, params = {}) => {
    try {
      await bridge.send('VKWebAppTapticNotificationOccurred', { type: 'success' });
      // Здесь можно добавить отправку статистики в VK
    } catch (error) {
      console.error('Ошибка отправки статистики:', error);
    }
  };

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
        attachments: 'https://vk.com/app_id' // Замените на ваш ID приложения
      });
    } catch (error) {
      console.error('Ошибка публикации:', error);
    }
  };

  return {
    user,
    isVKApp,
    showAd,
    sendStats,
    vibrate,
    shareScore
  };
};

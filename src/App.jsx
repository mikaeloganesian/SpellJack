import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainGame from './components/MainGame';
import Shop from './components/Shop';
import DeckEditor from './components/DeckEditor';
import Header from './components/Header';
import { useVK } from './hooks/useVK';
import './main.css';

const App = () => {
  const { user, isVKApp, vibrate } = useVK();

  useEffect(() => {
    // Настройка под VK интерфейс
    if (isVKApp) {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      // Легкая вибрация при запуске в VK
      vibrate('light');
    }
  }, [isVKApp, vibrate]);

  return (
    <div className={`app ${isVKApp ? 'vk-app' : ''}`}>
      <Header user={user} isVKApp={isVKApp} />
      <Routes>
        <Route path="/" element={<MainGame />} />
        <Route path="/shop" element={<Shop />} />
        <Route 
          path="/deck-editor" 
          element={<DeckEditor />} 
        />
      </Routes>
    </div>
  );
};

export default App;
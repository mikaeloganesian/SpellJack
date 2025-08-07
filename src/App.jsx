import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainGame from './components/MainGame';
import Shop from './components/Shop';
import DeckEditor from './components/DeckEditor';
import Header from './components/Header';
import './main.css';

const App = () => {
  return (
    <div className="app">
      <Header />
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
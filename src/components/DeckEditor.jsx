import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';
import CardModal from './CardModal';

const DeckEditor = observer(() => {
  // Состояние для модального окна
  const [selectedCard, setSelectedCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Функции для модального окна
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  const Card = ({ card, onClick, buttonText, isAddedToDeck }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const buttonClass = isAddedToDeck ? 'remove-card-button' : 'add-card-button';
    
    return (
      <div className="deck-card">
        <div 
          className={`card ${isRed ? 'red-card' : ''} ${card.special ? 'special-card' : ''}`}
          onClick={() => handleCardClick(card)}
          style={{ cursor: 'pointer' }}
          title="Нажмите для просмотра информации"
        >
          <div className="card-value">{card.value}</div>
          <div className="card-suit">{card.suit}</div>
        </div>
        <button className={buttonClass} onClick={() => onClick(card.id)}>{buttonText}</button>
      </div>
    );
  };

  const SpecialCard = ({ card, onClick, buttonText, isAddedToDeck }) => {
    const buttonClass = isAddedToDeck ? 'remove-card-button' : 'add-card-button';

    // Функция для сокращения длинных названий
    const getShortName = (name) => {
      const shortNames = {
        'Открытый взгляд': 'Взгляд',
        'Щит перегруза': 'Щит',
        'Двойной удар': 'x2 Удар',
        'Карта-ловушка': 'Ловушка',
        'Обмен удачи': 'Обмен',
        'Тузовая броня': 'Броня',
        'Сброс напряжения': 'Сброс',
        'Критический выбор': 'Выбор',
        'Двойная ставка': 'x2 Ставка',
        'Картограф': 'Карта',
        'Огненный туз': 'Огонь',
        'Счастливая семёрка': 'Семёрка',
        'Листопад': 'Лист',
        'Масть удачи': 'Удача',
        'Карта предвидения': 'Видение',
        'Стабилизатор': 'Стабил.',
        'Золотое касание': 'Золото',
        'Хронометр': 'Время',
        'Магнит мастей': 'Магнит',
        'Карта судьбы': 'Судьба',
        'Королевский указ': 'Указ'
      };
      return shortNames[name] || name;
    };
    
    
    return (
      <div className="deck-card">
        <div 
          className="card special-card" 
          onClick={() => handleCardClick(card)}
          style={{ cursor: 'pointer' }}
          title="Нажмите для просмотра информации"
        >
          <div className="card-value">{card.value}</div>
          <div className="card-suit">{getShortName(card.name)}</div>
        </div>
        <button className={buttonClass} onClick={() => onClick(card.id)}>{buttonText}</button>
      </div>
    );
  };

  const cardsNotInDeck = gameStore.playerOwnedCards.filter(
    (card) => !gameStore.playerDeck.some((deckCard) => deckCard.id === card.id)
  );

  return (
    <div className="deck-editor-container">
      <h2>Deck Editor</h2>
      <p>Build your deck for the game (cards: {gameStore.playerDeck.length}/52)</p>

      <div className="deck-section">
        <h3>My Deck</h3>
        <div className="deck-cards">
          {gameStore.playerDeck.length > 0 ? (
            gameStore.playerDeck.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={() => gameStore.removeCardFromDeck(card.id)} 
                buttonText="-" 
                isAddedToDeck={true}
              />
            ))
          ) : (
            <p className="empty-message">Deck is empty</p>
          )}
        </div>
      </div>

      {/* Раздел специальных карт */}
      <div className="deck-section">
        <h3>Специальные карты ({gameStore.activeSpecialCards.length}/3)</h3>
        <div className="deck-cards">
          {gameStore.activeSpecialCards.length > 0 ? (
            gameStore.activeSpecialCards.map((card) => (
              <SpecialCard 
                key={card.id} 
                card={card} 
                onClick={() => gameStore.removeSpecialCardFromDeck(card.id)} 
                buttonText="-" 
                isAddedToDeck={true}
              />
            ))
          ) : (
            <p className="empty-message">Нет активных специальных карт</p>
          )}
        </div>
      </div>
      
      <div className="collection-section">
        <h3>All My Cards</h3>
        <div className="collection-cards">
          {cardsNotInDeck.filter(card => !card.type || card.type !== 'special').length > 0 ? (
            cardsNotInDeck.filter(card => !card.type || card.type !== 'special').map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={() => gameStore.addCardToDeck(card)} 
                buttonText="+" 
                isAddedToDeck={false}
              />
            ))
          ) : (
            <p className="empty-message">All your cards are in the deck!</p>
          )}
        </div>
      </div>

      {/* Раздел доступных специальных карт */}
      <div className="collection-section">
        <h3>Доступные специальные карты</h3>
        <div className="collection-cards">
          {gameStore.playerOwnedCards.filter(card => 
            card.type === 'special' && 
            !gameStore.activeSpecialCards.some(activeCard => activeCard.id === card.id)
          ).length > 0 ? (
            gameStore.playerOwnedCards.filter(card => 
              card.type === 'special' && 
              !gameStore.activeSpecialCards.some(activeCard => activeCard.id === card.id)
            ).map((card) => (
              <SpecialCard 
                key={card.id} 
                card={card} 
                onClick={() => {
                  if (gameStore.activeSpecialCards.length >= 3) {
                    alert('Максимум 3 специальные карты в колоде!');
                    return;
                  }
                  gameStore.addSpecialCardToDeck(card);
                }} 
                buttonText="+" 
                isAddedToDeck={false}
              />
            ))
          ) : (
            <p className="empty-message">Все специальные карты уже в колоде!</p>
          )}
        </div>
      </div>

      <CardModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        showBuySection={false}
      />
    </div>
  );
});

export default DeckEditor;
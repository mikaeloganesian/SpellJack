import React from 'react';

const DeckEditor = ({ playerDeck, setPlayerDeck, playerOwnedCards }) => {
  
  // Добавление карты в колоду
  const addCardToDeck = (card) => {
    if (playerDeck.length < 60) { // Например, ограничим колоду 10 картами
      setPlayerDeck(prevDeck => [...prevDeck, card]);
    } else {
      alert('Колода заполнена (макс. 60 карт)!');
    }
  };

  // Удаление карты из колоды
  const removeCardFromDeck = (cardId) => {
    setPlayerDeck(prevDeck => prevDeck.filter(card => card.id !== cardId));
  };

  // Компонент-заглушка для карт
  const Card = ({ card, onClick, buttonText }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className="deck-card">
        <div className={`card ${isRed ? 'red-card' : ''}`}>
          <div className="card-value">{card.value}</div>
          <div className="card-suit">{card.suit}</div>
        </div>
        <button className="add-card-button" onClick={() => onClick(card.id)}>{buttonText}</button>
      </div>
    );
  };

  // Все карты, которые не находятся в текущей колоде
  const cardsNotInDeck = playerOwnedCards.filter(
    (card) => !playerDeck.some((deckCard) => deckCard.id === card.id)
  );

  return (
    <div className="deck-editor-container">
      <h2>Редактор колоды</h2>
      <p>Соберите колоду для игры (количество карт: {playerDeck.length})</p>

      <div className="deck-section">
        <h3>Моя колода</h3>
        <div className="deck-cards">
          {playerDeck.length > 0 ? (
            playerDeck.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={removeCardFromDeck} 
                buttonText="-" 
              />
            ))
          ) : (
            <p className="empty-message">Колода пуста</p>
          )}
        </div>
      </div>
      
      <div className="collection-section">
        <h3>Все мои карты</h3>
        <div className="collection-cards">
          {cardsNotInDeck.length > 0 ? (
            cardsNotInDeck.map((card) => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={() => addCardToDeck(card)} 
                buttonText="+" 
              />
            ))
          ) : (
            <p className="empty-message">Пока нет других карт в коллекции. Зайдите в магазин!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckEditor;
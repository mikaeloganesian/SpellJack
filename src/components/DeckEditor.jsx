import React from 'react';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const DeckEditor = observer(() => {
  const Card = ({ card, onClick, buttonText, isAddedToDeck }) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const buttonClass = isAddedToDeck ? 'remove-card-button' : 'add-card-button';
    
    return (
      <div className="deck-card">
        <div className={`card ${isRed ? 'red-card' : ''} ${card.special ? 'special-card' : ''}`}>
          <div className="card-value">{card.value}</div>
          <div className="card-suit">{card.suit}</div>
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
      <p>Build your deck for the game (cards: {gameStore.playerDeck.length}/10)</p>

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
      
      <div className="collection-section">
        <h3>All My Cards</h3>
        <div className="collection-cards">
          {cardsNotInDeck.length > 0 ? (
            cardsNotInDeck.map((card) => (
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
    </div>
  );
});

export default DeckEditor;
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

  const SpecialCard = ({ card, onClick, buttonText, isAddedToDeck }) => {
    const buttonClass = isAddedToDeck ? 'remove-card-button' : 'add-card-button';
    
    return (
      <div className="deck-card special">
        <div className="special-card-display">
          <div className="card-emoji">{card.value}</div>
          <div className="card-name">{card.id}</div>
          <div className="activation-type">{card.activationType}</div>
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
      <div className="special-deck-section">
        <h3>Специальные карты ({gameStore.activeSpecialCards.length}/3)</h3>
        <div className="special-deck-cards">
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
      <div className="special-collection-section">
        <h3>Доступные специальные карты</h3>
        <div className="special-collection-cards">
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
    </div>
  );
});

export default DeckEditor;
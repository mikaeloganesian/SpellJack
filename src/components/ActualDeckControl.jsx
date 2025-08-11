import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const ActualDeckControl = observer(({ visible, onClose, deck }) => {
  // Используем переданную колоду или fallback на колоду из store
  const displayDeck = deck || gameStore.playerDeck;

  return (
    <div className={`actual-deck-overlay ${visible ? 'open' : ''}`} onClick={onClose}>
      <div
        className="actual-deck-panel"
        onClick={(e) => e.stopPropagation()} // чтобы клик внутри не закрывал
      >
        <div className="deck-header">
          <div className="deck-title-wrap">
            <h3 className="deck-title">Current deck</h3>
            <span className="deck-subtitle">{displayDeck.length} cards</span>
          </div>
          <button className="deck-close" onClick={onClose}>Close</button>
        </div>

        <div className="deck-grid">
          {displayDeck.map((card) => {
            const isRed = card.suit === '♥' || card.suit === '♦';
            return (
              <div
                key={card.id}
                className={[
                  'card-tile',
                  isRed ? 'red' : '',
                  card.special ? 'special' : '',
                ].join(' ')}
                title={`${card.value}${card.suit}`}
              >
                <span className="tile-value">{card.value}</span>
                <span className="tile-suit">{card.suit}</span>
              </div>
            );
          })}
          {displayDeck.length === 0 && (
            <div className="deck-empty">Колода пуста</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ActualDeckControl;

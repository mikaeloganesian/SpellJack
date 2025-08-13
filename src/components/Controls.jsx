import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const Controls = observer(({ onHit, onStand, onNewGame, isGameActive }) => {
  return (
    <div className="controls-container">
      {isGameActive ? (
        <>
          <div className="control-button-wrapper">
            <button 
              className={`control-button ${gameStore.activeEffects.doubleNext ? 'double-next-ready' : ''}`} 
              onClick={onHit}
            >
              Get Card
              {gameStore.activeEffects.doubleNext && (
                <div className="double-next-badge">⚡ x2!</div>
              )}
            </button>
          </div>
          <button className="control-button" onClick={onStand}>Enought</button>
        </>
      ) : (
        <button className="new-game-button" onClick={onNewGame}>New Game</button>
      )}
    </div>
  );
});

export default Controls;
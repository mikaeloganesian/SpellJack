const Controls = ({ onHit, onStand, onNewGame, isGameActive }) => {
  return (
    <div className="controls-container">
      {isGameActive ? (
        <>
          <button className="control-button" onClick={onHit}>Get Card</button>
          <button className="control-button" onClick={onStand}>Enought</button>
        </>
      ) : (
        <button className="new-game-button" onClick={onNewGame}>New Game</button>
      )}
    </div>
  );
};

export default Controls;
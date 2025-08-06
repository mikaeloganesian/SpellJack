import React from 'react';

const Controls = ({ onHit, onStand, onNewGame, isGameActive }) => {
  return (
    <div className="controls-container">
      {isGameActive ? (
        <>
          <button className="control-button" onClick={onHit}>Взять карту</button>
          <button className="control-button" onClick={onStand}>Хватит</button>
        </>
      ) : (
        <button className="new-game-button" onClick={onNewGame}>Новая игра</button>
      )}
    </div>
  );
};

export default Controls;
const Card = ({ card }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div className={`card ${isRed ? 'red-card' : ''}`}>
      <div className="card-value">{card.value}</div>
      <div className="card-suit">{card.suit}</div>
    </div>
  );
};

const Player = ({ hand, score }) => {
  const getHandContainerClass = () => {
    const cardCount = hand.length;
    if (cardCount >= 12) return 'hand-container many-cards';
    if (cardCount >= 8) return 'hand-container medium-cards';
    return 'hand-container';
  };

  return (
    <div className="player-container">
      <h2>Player ({score})</h2>
      <div className={getHandContainerClass()}>
        {hand.map((card, index) => <Card key={index} card={card} />)}
      </div>
    </div>
  );
};

export default Player;
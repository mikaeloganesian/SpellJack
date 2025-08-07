import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const Header = observer(() => {
  return (
    <nav className="header-nav">
      <div className="coin-display">
        💰 {gameStore.coins}
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Play</Link>
        <Link to="/shop" className="nav-link">Shop</Link>
        <Link to="/deck-editor" className="nav-link">Deck</Link>
      </div>
    </nav>
  );
});

export default Header;
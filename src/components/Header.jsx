import React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { gameStore } from '../Store';

const Header = observer(({ user, isVKApp }) => {
  return (
    <nav className="header-nav">
      <div className="coin-display">
        💰 {gameStore.coins}
      </div>
      {isVKApp && user && (
        <div className="user-info">
          {user.photo_100 && (
            <img 
              src={user.photo_100} 
              alt={`${user.first_name} ${user.last_name}`}
              className="user-avatar"
            />
          )}
          <span className="user-name">{user.first_name}</span>
        </div>
      )}
      <div className="nav-links">
        <Link to="/" className="nav-link">Play</Link>
        <Link to="/shop" className="nav-link">Shop</Link>
        <Link to="/deck-editor" className="nav-link">Deck</Link>
      </div>
    </nav>
  );
});

export default Header;
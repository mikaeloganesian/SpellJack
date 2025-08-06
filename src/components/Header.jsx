import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ coins }) => {
  return (
    <nav className="header-nav">
      <div className="coin-display">
        💰 {coins}
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Играть</Link>
        <Link to="/shop" className="nav-link">Магазин</Link>
        <Link to="/deck-editor" className="nav-link">Колода</Link>
      </div>
    </nav>
  );
};

export default Header;
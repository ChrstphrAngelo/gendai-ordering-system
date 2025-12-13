import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Menu from './components/Menu/Menu';
import Cart from './components/Cart/Cart';
import Admin from './components/Admin/Admin';
import './App.css';

function App() {
  const [cart, setCart] = useState([]);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (menuItem, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuItem._id === menuItem._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.menuItem._id === menuItem._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prevCart, { menuItem, quantity }];
      }
    });
  };

  const updateQuantity = (itemId, change, newItem = null) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.menuItem._id === itemId);
      
      if (existingItem) {
        // Update existing item
        return prevCart
          .map(item =>
            item.menuItem._id === itemId
              ? { ...item, quantity: Math.max(0, item.quantity + change) }
              : item
          )
          .filter(item => item.quantity > 0);
      } else if (newItem && change > 0) {
        // Add new item (for add-ons)
        return [...prevCart, { menuItem: newItem, quantity: change }];
      }
      
      return prevCart;
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/menu" />} />
          <Route 
            path="/menu" 
            element={<Menu addToCart={addToCart} />} 
          />
          <Route 
            path="/cart" 
            element={
              <Cart 
                cart={cart} 
                updateQuantity={updateQuantity} 
                clearCart={clearCart}
              />
            } 
          />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
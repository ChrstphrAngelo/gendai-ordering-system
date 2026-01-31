import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Menu from './components/Menu/Menu';
import Cart from './components/Cart/Cart';
import Admin from './components/Admin/Admin';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import './App.css';

function App() {
    const [cart, setCart] = useState([]);

    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }
    }, []);

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
                return prevCart
                    .map(item =>
                        item.menuItem._id === itemId
                            ? { ...item, quantity: Math.max(0, item.quantity + change) }
                            : item
                    )
                    .filter(item => item.quantity > 0);
            } else if (newItem && change > 0) {
                return [...prevCart, { menuItem: newItem, quantity: change }];
            }
            
            return prevCart;
        });
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Navigate to="/menu" />} />
                        <Route path="/menu" element={<Menu addToCart={addToCart} />} />
                        <Route path="/cart" element={
                            <Cart 
                                cart={cart} 
                                updateQuantity={updateQuantity} 
                                clearCart={clearCart}
                            />
                        } />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <Admin />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
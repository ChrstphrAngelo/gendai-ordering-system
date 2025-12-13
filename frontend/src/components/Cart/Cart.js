import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './cartStyle.css';

const Cart = ({ cart, updateQuantity, clearCart }) => {
  const [tableNumber, setTableNumber] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [orderType, setOrderType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false); // Add loading state

  const addons = [
    { id: 'miso-soup', name: 'Miso Soup', price: 60.00, image: 'Misosoup.png' },
    { id: 'tofu-steak', name: 'Tofu Steak', price: 175.00, image: 'Tofusteak.png' },
    { id: 'crazy-maki', name: 'Crazy Maki', price: 235.00, image: 'Crazymaki.png' },
    { id: 'futomaki', name: 'Futomaki', price: 245.00, image: 'Futomaki.png' },
    { id: 'spicy-salmon-salad', name: 'Spicy Salmon Salad', price: 230.00, image: 'Spicysalmonsalad.png' },
    { id: 'gyudon', name: 'Gyudon', price: 250.00, image: 'Gyudon.png' }
  ];

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const selectTable = (tableNum) => {
    setTableNumber(tableNum);
    setShowDropdown(false);
  };

  const handleAddAddon = (addon) => {
    setSelectedAddon(addon);
    setShowModal(true);
  };

  const confirmAddAddon = () => {
    if (selectedAddon) {
      const addonItem = {
        _id: selectedAddon.id,
        name: selectedAddon.name,
        price: selectedAddon.price,
        image: selectedAddon.image,
        category: 'Add-ons'
      };
      
      updateQuantity(selectedAddon.id, 1, addonItem);
      
      setShowModal(false);
      setSelectedAddon(null);
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!tableNumber) {
      alert('Please select a table number');
      return;
    }

    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (!orderType) {
      alert('Please select an order type');
      return;
    }

    setIsPlacingOrder(true);

    try {
      console.log('Placing order with cart:', cart); // Debug log
      
      const orderData = {
        customerName: 'Customer',
        items: cart.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity,
          price: item.menuItem.price,
          itemName: item.menuItem.name,
          itemPrice: item.menuItem.price,
          isAddon: item.menuItem.category === 'Add-ons'
        })),
        totalAmount: getTotalAmount(),
        tableNumber: tableNumber,
        paymentMethod: paymentMethod,
        orderType: orderType
      };

      console.log('Sending order data:', orderData); // Debug log

      const response = await axios.post('http://localhost:5000/api/orders', orderData);
      console.log('Order response:', response.data); // Debug log
      
      alert('Order placed successfully!');
      clearCart();
      window.location.href = '/menu';
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.response) {
        console.error('Server response status:', error.response.status);
        console.error('Server response data:', error.response.data);
        alert(`Error placing order: ${error.response.data.message || error.response.data.error || 'Please try again.'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from server. Please check if the server is running.');
      } else {
        console.error('Error setting up request:', error.message);
        alert('Error placing order. Please try again.');
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    document.body.classList.add('cart-page');
    
    return () => {
      document.body.classList.remove('cart-page');
    };
  }, []);

  return (
    <div className="pc-container">
      <header>
        <section className="navbar">
          <div className="nav-bar-container">
            <div className="previous-button-container">
              <button 
                className="previous-button" 
                onClick={() => window.location.href = '/menu'}
              ></button>
            </div>
            <div>
              <h2 className="title">Cart</h2>
            </div>
          </div>
        </section>
      </header>

      <section className="cart-container">
        <div className="cart-item-container">
          {cart.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Your cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.menuItem._id} className="cart-item-row">
                <img 
                  src={`/images/${item.menuItem.image}`} 
                  alt={item.menuItem.name} 
                  className="item-image" 
                />
                <div className="item-details">
                  <h4>{item.menuItem.name}</h4>
                  <p>₱ {item.menuItem.price.toFixed(2)}</p>
                  {item.menuItem.category === 'Add-ons' && (
                    <p style={{ fontSize: '12px', color: '#888' }}>(Add-on)</p>
                  )}
                </div>
                <div className="quantity-control">
                  <button 
                    className="decrease-btn"
                    onClick={() => updateQuantity(item.menuItem._id, -1)}
                  >−</button>
                  <span className="item-quantity">{item.quantity}</span>
                  <button 
                    className="increase-btn"
                    onClick={() => updateQuantity(item.menuItem._id, 1)}
                  >+</button>
                </div>
                <div className="item-price">
                  ₱ {(item.menuItem.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="bottom-panel">
          <hr className="bottom-panel-line" />
          <button 
            className="add-more-button" 
            onClick={() => window.location.href = '/menu'}
          >
            <span>+</span> Add more items
          </button>
        </div>
      </section>

      <section className="add-ons-container">
        <h2 className="add-ons-title">You might want to add</h2>
        <div className="add-ons-item-container">
          <ul className="add-ons-list">
            {addons.map(addon => (
              <li key={addon.id} className="add-ons-item">
                <div className="add-ons-image">
                  <img src={`/images/${addon.image}`} alt={addon.name} />
                  <button 
                    className="add-to-cart-button"
                    onClick={() => handleAddAddon(addon)}
                  >+</button>
                </div>
                <div className="add-ons-price">₱ {addon.price.toFixed(2)}</div>
                <div className="add-ons-name">{addon.name}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className={`myModal ${showModal ? 'show' : ''}`} style={{display: showModal ? 'flex' : 'none'}}>
          <div className="modal-content">
            <p>Add {selectedAddon?.name} to cart?</p>
            <button onClick={confirmAddAddon}>Yes</button>
            <button onClick={() => setShowModal(false)}>No</button>
          </div>
        </div>

        <div id="snackbar" className={showSnackbar ? 'show' : ''}>
          Item Added!
        </div>
      </section>

      <form>
        <section className="table-container">
          <h2 className="table-title">Table Number</h2>
          <div className="table-dropdown-container">
            <button 
              type="button" 
              className={`table-dropdown-button ${tableNumber ? 'selected' : ''}`}
              onClick={toggleDropdown}
            >
              {tableNumber ? `Table ${tableNumber}` : 'Select Table'}
            </button>
            <div className={`table-dropdown-content ${showDropdown ? 'show' : ''}`}>
              {[1, 2, 3, 4, 5].map(num => (
                <div 
                  key={num}
                  className={`table-option ${tableNumber === num ? 'selected' : ''}`}
                  onClick={() => selectTable(num)}
                >
                  Table {num}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="payment-container">
          <h2 className="payment-title">Payment Method</h2>
          <div className="payment-options-container">
            <label className="payment-option">
              <input 
                type="radio" 
                name="payment-option" 
                value="Cash"
                checked={paymentMethod === 'Cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Cash</span>
            </label>
            <label className="payment-option">
              <input 
                type="radio" 
                name="payment-option" 
                value="GCash"
                checked={paymentMethod === 'GCash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>GCash</span>
            </label>
          </div>
        </section>

        <section className="order-type-container">
          <h2 className="order-type-title">Order Type</h2>
          <div className="order-type-options-container">
            <label className="order-type">
              <input 
                type="radio" 
                name="order-type" 
                value="Dine In"
                checked={orderType === 'Dine In'}
                onChange={(e) => setOrderType(e.target.value)}
              />
              <span>Dine In</span>
            </label>
            <label className="order-type">
              <input 
                type="radio" 
                name="order-type" 
                value="Take Out"
                checked={orderType === 'Take Out'}
                onChange={(e) => setOrderType(e.target.value)}
              />
              <span>Take Out</span>
            </label>
          </div>
        </section>
      </form>

      <footer>
        <section className="footer-container">
          <div className="total-item-container">
            <h2 className="total-title">Total</h2>
            <div className="single-total-item">
              <span>Items ({getTotalItems()}):</span>
              <span>₱ {getTotalAmount().toFixed(2)}</span>
            </div>
          </div>
          <div className="button-container">
            <button 
              className="checkout-button" 
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </section>
      </footer>
    </div>
  );
};

export default Cart;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import './menuStyle.css';

const Menu = ({ addToCart }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState({});
  
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      console.log('Fetching menu items...');
      const response = await axios.get('http://localhost:5000/api/menu');
      console.log('Menu items received:', response.data);
      setMenuItems(response.data);
      
      // Extract unique categories from menu items
      const uniqueCategories = [...new Set(response.data.map(item => item.category))];
      console.log('Unique categories found:', uniqueCategories);
      
      setCategories(['All', ...uniqueCategories]);
      
      // Initialize quantities
      const initialQuantities = {};
      response.data.forEach(item => {
        const slug = item.name.toLowerCase().replace(/ /g, '-');
        initialQuantities[slug] = 0;
      });
      setQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const increaseQty = (slug) => {
    setQuantities(prev => ({
      ...prev,
      [slug]: (prev[slug] || 0) + 1
    }));
  };

  const decreaseQty = (slug) => {
    setQuantities(prev => ({
      ...prev,
      [slug]: Math.max(0, (prev[slug] || 0) - 1)
    }));
  };

  const filterCategory = (category) => {
    console.log('Filtering by category:', category);
    setSelectedCategory(category);
  };

  const scrollCategories = (scrollOffset) => {
    const categoryBar = document.getElementById('categoryBar');
    if (categoryBar) {
      categoryBar.scrollLeft += scrollOffset;
    }
  };

  const goToCart = () => {
    let itemsAdded = false;
    
    // Add items with quantity > 0 to cart
    Object.keys(quantities).forEach(slug => {
      if (quantities[slug] > 0) {
        const item = menuItems.find(menuItem => 
          menuItem.name.toLowerCase().replace(/ /g, '-') === slug
        );
        if (item) {
          addToCart(item, quantities[slug]);
          itemsAdded = true;
          console.log(`Added ${quantities[slug]} x ${item.name} to cart`);
        }
      }
    });
    
    if (itemsAdded) {
      navigate('/cart');
    } else {
      alert('Please add items to your cart first');
    }
  };

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => {
        const matches = item.category === selectedCategory;
        return matches;
      });

  return (
    <div className="menu-page-container">
      <header className="header">
        <div className="header-container">
          <img src="/images/new logo 1.png" alt="Gendai Logo" className="logo" />
        </div>
      </header>

      <div className="menu-wrapper">
        <div className="image-display">
          <img src="/images/gendai_display.png" alt="Tonkotsu Ramen" id="gendai_display" />
        </div>

        <div className="header-wrapper">
          <button className="arrow-btn" onClick={() => scrollCategories(-150)}>
            <svg className="arrow-icon" viewBox="0 0 20 20" width="20" height="20">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          <div className="category-bar" id="categoryBar">
            {categories.map(category => (
              <button
                key={category}
                className={`category ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => filterCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <button className="arrow-btn" onClick={() => scrollCategories(150)}>
            <svg className="arrow-icon" viewBox="0 0 20 20" width="20" height="20">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>
        </div>

        <div className="menu-container">
          {filteredItems.length === 0 ? (
            <div className="no-items-message">
              No items found in "{selectedCategory}" category.
            </div>
          ) : (
            filteredItems.map(item => {
              const slug = item.name.toLowerCase().replace(/ /g, '-');
              return (
                <div key={item._id} className="item" data-category={item.category}>
                  <div className="item-left">
                    <img src={`/images/${item.image}`} alt={item.name} />
                    <div className="item-details">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <p><strong>Price:</strong> ₱{item.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="quantity-control">
                    <button className="button" onClick={() => decreaseQty(slug)}>−</button>
                    <span className="quantity" id={slug}>{quantities[slug] || 0}</span>
                    <button className="button" onClick={() => increaseQty(slug)}>+</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
          
      <div className="checkout-footer">
        <button className="checkout-button" onClick={goToCart}>Check Order</button>
      </div>
      
    </div>
  );
};

export default Menu;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [message, setMessage] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    if (activeTab === 'menu') {
      fetchMenuItems();
    } else {
      fetchOrders();
    }
  }, [activeTab]);

  useEffect(() => {
    // Filter orders based on showCompleted state
    if (showCompleted) {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status !== 'completed'));
    }
  }, [orders, showCompleted]);

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMessage('Error fetching menu items');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage('Error fetching orders');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewMenuItem({
        ...newMenuItem,
        image: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', newMenuItem.name);
    formData.append('description', newMenuItem.description);
    formData.append('price', newMenuItem.price);
    formData.append('category', newMenuItem.category);
    
    if (newMenuItem.image && newMenuItem.image instanceof File) {
      formData.append('image', newMenuItem.image);
    } else if (newMenuItem.image && typeof newMenuItem.image === 'string') {
      formData.append('image', newMenuItem.image);
    }
    
    try {
      if (editingItem) {
        await axios.put(`http://localhost:5000/api/menu/${editingItem._id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage('Menu item updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/menu', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage('Menu item added successfully');
      }
      
      setNewMenuItem({
        name: '',
        description: '',
        price: '',
        category: '',
        image: null
      });
      setPreviewImage('');
      setEditingItem(null);
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      setMessage('Error saving menu item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNewMenuItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image
    });
    setPreviewImage(`/images/${item.image}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await axios.delete(`http://localhost:5000/api/menu/${id}`);
        setMessage('Menu item deleted successfully');
        fetchMenuItems();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        setMessage('Error deleting menu item');
      }
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });
      setMessage('Order status updated successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      setMessage('Error updating order status');
    }
  };

  const toggleShowCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1>Admin Dashboard</h1>
      
      {message && (
        <div style={{
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          border: `1px solid ${message.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', marginBottom: '2rem', borderBottom: '1px solid #bdc3c7' }}>
        <button 
          style={{
            padding: '1rem 2rem',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontSize: '1rem',
            borderBottom: `3px solid ${activeTab === 'menu' ? '#3498db' : 'transparent'}`,
            color: activeTab === 'menu' ? '#3498db' : 'inherit'
          }}
          onClick={() => setActiveTab('menu')}
        >
          Manage Menu
        </button>
        <button 
          style={{
            padding: '1rem 2rem',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontSize: '1rem',
            borderBottom: `3px solid ${activeTab === 'orders' ? '#3498db' : 'transparent'}`,
            color: activeTab === 'orders' ? '#3498db' : 'inherit'
          }}
          onClick={() => setActiveTab('orders')}
        >
          View Orders
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {activeTab === 'menu' && (
          <>
            <form style={{
              marginBottom: '2rem',
              padding: '1.5rem',
              background: '#f8f9fa',
              borderRadius: '8px'
            }} onSubmit={handleSubmit}>
              <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Name:</label>
                  <input
                    type="text"
                    value={newMenuItem.name}
                    onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                    required
                    style={{ padding: '0.75rem', border: '1px solid #bdc3c7', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Price:</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMenuItem.price}
                    onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                    required
                    style={{ padding: '0.75rem', border: '1px solid #bdc3c7', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                <label>Description:</label>
                <input
                  type="text"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                  required
                  style={{ padding: '0.75rem', border: '1px solid #bdc3c7', borderRadius: '4px', fontSize: '1rem' }}
                />
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Category:</label>
                  <input
                    type="text"
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})}
                    required
                    style={{ padding: '0.75rem', border: '1px solid #bdc3c7', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label>Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ padding: '0.75rem', border: '1px solid #bdc3c7', borderRadius: '4px', fontSize: '1rem' }}
                  />
                </div>
              </div>
              
              {previewImage && (
                <div style={{ marginBottom: '1rem' }}>
                  <label>Image Preview:</label>
                  <div>
                    <img 
                      src={previewImage} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px',
                        marginTop: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #bdc3c7'
                      }} 
                    />
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  backgroundColor: '#3498db',
                  color: 'white'
                }}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                {editingItem && (
                  <button 
                    type="button" 
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      backgroundColor: '#6c757d',
                      color: 'white'
                    }}
                    onClick={() => {
                      setEditingItem(null);
                      setNewMenuItem({
                        name: '',
                        description: '',
                        price: '',
                        category: '',
                        image: null
                      });
                      setPreviewImage('');
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div>
              <h3>Current Menu Items</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {menuItems.map(item => (
                  <div key={item._id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    borderLeft: '4px solid #3498db'
                  }}>
                    <div>
                      <h4 style={{ color: '#2c3e50', marginBottom: '0.25rem' }}>{item.name}</h4>
                      <p style={{ color: '#7f8c8d', marginBottom: '0.25rem' }}>{item.description}</p>
                      <p style={{ color: '#7f8c8d', marginBottom: '0.25rem' }}>
                        <strong>₱{item.price.toFixed(2)}</strong> • {item.category}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        style={{
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: '#3498db',
                          color: 'white'
                        }}
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                      <button 
                        style={{
                          padding: '0.5rem 1rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: '#e74c3c',
                          color: 'white'
                        }}
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Order History</h3>
              <button 
                onClick={toggleShowCompleted}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: showCompleted ? '#95a5a6' : '#3498db',
                  color: 'white',
                  fontSize: '0.9rem'
                }}
              >
                {showCompleted ? 'Hide Completed Orders' : 'Show Completed Orders'}
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredOrders.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  color: '#7f8c8d'
                }}>
                  {showCompleted ? 'No orders found' : 'No active orders (completed orders are hidden)'}
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order._id} style={{
                    padding: '1.5rem',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${
                      order.status === 'preparing' ? '#f39c12' :
                      order.status === 'ready' ? '#27ae60' :
                      order.status === 'completed' ? '#95a5a6' : '#3498db'
                    }`
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h4 style={{ color: '#2c3e50', marginBottom: '0.25rem' }}>{order.customerName}</h4>
                        <p style={{ color: '#7f8c8d', marginBottom: '0.25rem' }}>
                          Order Date: {new Date(order.createdAt).toLocaleString()}
                        </p>
                        {order.tableNumber && (
                          <p style={{ color: '#7f8c8d', marginBottom: '0.25rem' }}>
                            Table: {order.tableNumber}
                          </p>
                        )}
                        {order.paymentMethod && (
                          <p style={{ color: '#7f8c8d', marginBottom: '0.25rem' }}>
                            Payment: {order.paymentMethod}
                          </p>
                        )}
                        {order.orderType && (
                          <p style={{ color: '#7f8c8d', marginBottom: '0.25rem' }}>
                            Type: {order.orderType}
                          </p>
                        )}
                      </div>
                      <div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          backgroundColor: 
                            order.status === 'preparing' ? '#f39c12' :
                            order.status === 'ready' ? '#27ae60' :
                            order.status === 'completed' ? '#95a5a6' : '#3498db',
                          color: 'white'
                        }}>
                          {order.status.toUpperCase()}
                        </span>
                        <p style={{ marginTop: '0.5rem' }}>
                          <strong>Total: ₱{order.totalAmount.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem' }}>
                      <h5>Order Items:</h5>
                      {order.items.map((item, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0',
                          borderBottom: '1px solid #dee2e6'
                        }}>
                          <span>
                            {item.quantity}x {item.itemName || item.menuItem?.name || 'Item'}
                          </span>
                          <span>₱{(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                      <label>Update Status: </label>
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #bdc3c7' }}
                      >
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    const { user, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    
    const adminContentRef = useRef(null);

    const api = axios.create({
        baseURL: 'http://localhost:5000/api',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    // Add request interceptor to include token
    api.interceptors.request.use(
        config => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        error => {
            return Promise.reject(error);
        }
    );

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    // Auto-clear messages after 5 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Scroll to top when switching tabs
    useEffect(() => {
        if (adminContentRef.current) {
            adminContentRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'menu') {
            fetchMenuItems();
        } else {
            fetchOrders();
        }
    }, [activeTab]);

    useEffect(() => {
        if (showCompleted) {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.status !== 'completed'));
        }
    }, [orders, showCompleted]);

    const fetchMenuItems = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/menu');
            setMenuItems(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                setMessage('Error fetching menu items');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/orders');
            setOrders(response.data);
        } catch (error) {
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                setMessage('Error fetching orders');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const validateMenuItem = () => {
        if (!newMenuItem.name.trim()) {
            setMessage('Name is required');
            return false;
        }
        if (!newMenuItem.price || parseFloat(newMenuItem.price) <= 0) {
            setMessage('Price must be greater than 0');
            return false;
        }
        if (!newMenuItem.category.trim()) {
            setMessage('Category is required');
            return false;
        }
        return true;
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage('Image size should be less than 5MB');
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                setMessage('Please select an image file');
                return;
            }
            
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
        
        if (!validateMenuItem()) {
            return;
        }
        
        const formData = new FormData();
        formData.append('name', newMenuItem.name.trim());
        formData.append('description', newMenuItem.description.trim());
        formData.append('price', newMenuItem.price);
        formData.append('category', newMenuItem.category.trim());
        
        if (newMenuItem.image && newMenuItem.image instanceof File) {
            formData.append('image', newMenuItem.image);
        } else if (newMenuItem.image && typeof newMenuItem.image === 'string') {
            formData.append('image', newMenuItem.image);
        }
        
        try {
            let response;
            if (editingItem) {
                response = await api.put(`/menu/${editingItem._id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setMessage('Menu item updated successfully');
            } else {
                response = await api.post('/menu', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setMessage('Menu item added successfully');
            }
            
            resetForm();
            fetchMenuItems();
        } catch (error) {
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                setMessage(error.response?.data?.message || 'Error saving menu item');
            }
        }
    };

    const resetForm = () => {
        setNewMenuItem({
            name: '',
            description: '',
            price: '',
            category: '',
            image: null
        });
        setPreviewImage('');
        setEditingItem(null);
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
        setPreviewImage(item.imageUrl || `/images/${item.image}`);
    };

    const cancelEdit = () => {
        setEditingItem(null);
        resetForm();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                await api.delete(`/menu/${id}`);
                setMessage('Menu item deleted successfully');
                fetchMenuItems();
            } catch (error) {
                if (error.response?.status === 401) {
                    handleLogout();
                } else {
                    setMessage('Error deleting menu item');
                }
            }
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        if (window.confirm(`Change order status to ${newStatus}?`)) {
            try {
                await api.put(`/orders/${orderId}`, { status: newStatus });
                setMessage('Order status updated successfully');
                fetchOrders();
            } catch (error) {
                if (error.response?.status === 401) {
                    handleLogout();
                } else {
                    setMessage('Error updating order status');
                }
            }
        }
    };

    const toggleShowCompleted = () => {
        setShowCompleted(!showCompleted);
    };

    if (!user) {
        return null;
    }

    return (
        <div className="admin-container">
            {/* Global Styles */}
            <style jsx="true">{`
                .admin-container {
                    font-family: 'Montserrat', sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: #a1a1a1;
                }

                /* Smooth Transitions */
                * {
                    transition: all 0.3s ease;
                }

                /* Loading Animation */
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Card Hover Effects */
                .menu-item-card, .order-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .menu-item-card:hover, .order-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                }
            `}</style>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <div className="loading-spinner"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            )}

            {/* Main Admin Dashboard */}
            <div className="admin-dashboard">
                {/* Header */}
                <div className="admin-header">
                    <div className="header-content">
                        <div>
                            <h1>Gendai Restaurant Admin</h1>
                            <p className="header-subtitle">Manage menu and orders</p>
                        </div>
                        <div className="user-info">
                            <div className="user-details">
                                <span className="user-name">👤 {user.username}</span>
                                <span className="user-role">Admin</span>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="logout-button"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`message-banner ${message.includes('Error') ? 'error' : 'success'}`}>
                        <span>{message}</span>
                        <button 
                            onClick={() => setMessage('')}
                            className="message-close"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="admin-main">
                    {/* Sidebar Navigation */}
                    <div className="admin-sidebar">
                        <div className="sidebar-section">
                            <h3 className="sidebar-title">Navigation</h3>
                            <button
                                onClick={() => setActiveTab('menu')}
                                className={`sidebar-tab ${activeTab === 'menu' ? 'active' : ''}`}
                            >
                                <span className="tab-icon">🍣</span>
                                Menu Management
                                <span className="tab-badge">{menuItems.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`sidebar-tab ${activeTab === 'orders' ? 'active' : ''}`}
                            >
                                <span className="tab-icon">📦</span>
                                Order Management
                                <span className="tab-badge">{filteredOrders.length}</span>
                            </button>
                        </div>

                        <div className="sidebar-section">
                            <h3 className="sidebar-title">Quick Stats</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <span className="stat-value">{menuItems.length}</span>
                                    <span className="stat-label">Menu Items</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{orders.filter(o => o.status === 'preparing').length}</span>
                                    <span className="stat-label">Preparing</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{orders.filter(o => o.status === 'ready').length}</span>
                                    <span className="stat-label">Ready</span>
                                </div>
                                <div className="stat-card">
                                    <span className="stat-value">{orders.filter(o => o.status === 'completed').length}</span>
                                    <span className="stat-label">Completed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Panel - Fixed height with scroll */}
                    <div className="admin-content" ref={adminContentRef}>
                        {/* Menu Management */}
                        {activeTab === 'menu' && (
                            <div className="menu-management">
                                {/* Add/Edit Menu Item Form */}
                                <div className="form-card">
                                    <h2 className="form-title">
                                        {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                                    </h2>
                                    <form onSubmit={handleSubmit} className="menu-form">
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Name *</label>
                                                <input
                                                    type="text"
                                                    value={newMenuItem.name}
                                                    onChange={(e) => setNewMenuItem({...newMenuItem, name: e.target.value})}
                                                    required
                                                    placeholder="e.g., California Roll"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Price *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={newMenuItem.price}
                                                    onChange={(e) => setNewMenuItem({...newMenuItem, price: e.target.value})}
                                                    required
                                                    placeholder="e.g., 285.00"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Category *</label>
                                                <input
                                                    type="text"
                                                    value={newMenuItem.category}
                                                    onChange={(e) => setNewMenuItem({...newMenuItem, category: e.target.value})}
                                                    required
                                                    placeholder="e.g., Sushi"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Image</label>
                                                <div className="file-upload">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                        id="image-upload"
                                                    />
                                                    <label htmlFor="image-upload" className="upload-button">
                                                        📁 Choose File
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="form-group">
                                            <label>Description *</label>
                                            <textarea
                                                value={newMenuItem.description}
                                                onChange={(e) => setNewMenuItem({...newMenuItem, description: e.target.value})}
                                                required
                                                rows="3"
                                                placeholder="Describe the menu item..."
                                            />
                                        </div>
                                        
                                        {previewImage && (
                                            <div className="image-preview">
                                                <label>Image Preview</label>
                                                <div className="preview-container">
                                                    <img 
                                                        src={previewImage} 
                                                        alt="Preview" 
                                                        className="preview-image"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="form-actions">
                                            <button type="submit" className="submit-button">
                                                {editingItem ? 'Update Item' : 'Add Item'}
                                            </button>
                                            {editingItem && (
                                                <button 
                                                    type="button" 
                                                    className="cancel-button"
                                                    onClick={cancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>

                                {/* Menu Items List - FIXED: Multi-column layout */}
                                <div className="menu-items-list">
                                    <div className="list-header">
                                        <h2>Menu Items ({menuItems.length})</h2>
                                        <div className="list-actions">
                                            <button 
                                                onClick={fetchMenuItems}
                                                className="refresh-button"
                                            >
                                                ↻ Refresh
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {menuItems.length === 0 ? (
                                        <div className="empty-state">
                                            <p>No menu items found. Add your first item above.</p>
                                        </div>
                                    ) : (
                                        <div className="items-grid">
                                            {menuItems.map(item => (
                                                <div key={item._id} className="menu-item-card">
                                                    <div className="item-image-container">
                                                        <img 
                                                            src={`/images/${item.image}`} 
                                                            alt={item.name} 
                                                            className="item-image"
                                                            onError={(e) => {
                                                                e.target.src = '/images/default-food.jpg';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="item-content">
                                                        <div className="item-header">
                                                            <h3 className="item-name">{item.name}</h3>
                                                            <span className="item-price">₱{item.price.toFixed(2)}</span>
                                                        </div>
                                                        <p className="item-description">{item.description}</p>
                                                        <div className="item-footer">
                                                            <span className="item-category">{item.category}</span>
                                                            <div className="item-actions">
                                                                <button 
                                                                    onClick={() => handleEdit(item)}
                                                                    className="edit-button"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="delete-button"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Management */}
                        {activeTab === 'orders' && (
                            <div className="order-management">
                                <div className="orders-header">
                                    <div>
                                        <h2>Order Management</h2>
                                        <p className="subtitle">
                                            {showCompleted ? 'Showing all orders' : 'Showing active orders only'}
                                        </p>
                                    </div>
                                    <div className="orders-controls">
                                        <div className="filter-toggle">
                                            <span className="filter-label">Show Completed Orders:</span>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={showCompleted}
                                                    onChange={toggleShowCompleted}
                                                />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="orders-container">
                                    {filteredOrders.length === 0 ? (
                                        <div className="empty-state">
                                            <p>No orders found {showCompleted ? '' : '(completed orders are hidden)'}</p>
                                        </div>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <div key={order._id} className="order-card">
                                                <div className="order-header">
                                                    <div className="order-info">
                                                        <h3 className="order-number">
                                                            Order #{order._id.substring(order._id.length - 6)}
                                                        </h3>
                                                        <div className="order-meta">
                                                            <span className="customer-name">
                                                                👤 {order.customerName}
                                                            </span>
                                                            <span className="order-date">
                                                                📅 {new Date(order.createdAt).toLocaleString()}
                                                            </span>
                                                            {order.tableNumber && (
                                                                <span className="table-number">
                                                                    🪑 Table {order.tableNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="order-status-section">
                                                        <span className={`status-badge ${order.status}`}>
                                                            {order.status.toUpperCase()}
                                                        </span>
                                                        <div className="order-total">
                                                            ₱{order.totalAmount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="order-items">
                                                    <h4>Order Items</h4>
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="order-item">
                                                            <span className="item-quantity">{item.quantity}x</span>
                                                            <span className="item-name">
                                                                {item.itemName || item.menuItem?.name || 'Item'}
                                                            </span>
                                                            <span className="item-price">
                                                                ₱{(item.quantity * item.price).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="order-footer">
                                                    <div className="status-controls">
                                                        <label>Update Status:</label>
                                                        <select 
                                                            value={order.status}
                                                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                            className="status-select"
                                                        >
                                                            <option value="preparing">🔄 Preparing</option>
                                                            <option value="ready">✅ Ready</option>
                                                            <option value="completed">✓ Completed</option>
                                                        </select>
                                                    </div>
                                                    <button 
                                                        onClick={() => updateOrderStatus(order._id, 'completed')}
                                                        disabled={order.status === 'completed'}
                                                        className={`complete-button ${order.status === 'completed' ? 'completed' : ''}`}
                                                    >
                                                        {order.status === 'completed' ? '✓ Completed' : 'Mark as Completed'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Inline CSS for the redesign */}
            <style jsx="true">{`
                /* Loading Styles */
                .loading-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255, 255, 255, 0.95);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                }
                .loading-content {
                    text-align: center;
                }
                .loading-spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #ff6b6b;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                }

                /* Header Styles */
                .admin-header {
                    background: white;
                    border-radius: 12px;
                    padding: 25px 30px;
                    margin: 20px 20px 25px 20px;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
                    flex-shrink: 0;
                }
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .admin-header h1 {
                    margin: 0;
                    font-size: 28px;
                    color: #333;
                }
                .header-subtitle {
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 14px;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .user-details {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                .user-name {
                    font-weight: 600;
                    color: #333;
                }
                .user-role {
                    font-size: 12px;
                    color: #ff6b6b;
                    background: #ffeaea;
                    padding: 2px 8px;
                    border-radius: 10px;
                    margin-top: 4px;
                }
                .logout-button {
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.3s;
                }
                .logout-button:hover {
                    background: #ff5252;
                }

                /* Message Banner */
                .message-banner {
                    padding: 15px 25px;
                    border-radius: 8px;
                    margin: 0 20px 25px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    animation: slideIn 0.3s ease;
                    flex-shrink: 0;
                }
                .message-banner.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .message-banner.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .message-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: inherit;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                .message-close:hover {
                    background: rgba(0, 0, 0, 0.1);
                }

                /* Main Layout - FIXED: Proper flex layout with scrolling */
                .admin-main {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 25px;
                    flex: 1;
                    margin: 0 20px 20px 20px;
                    min-height: 0; /* Important for Firefox */
                }

                /* Sidebar Styles */
                .admin-sidebar {
                    background: white;
                    border-radius: 12px;
                    padding: 25px;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
                    height: fit-content;
                    position: sticky;
                    top: 20px;
                }
                .sidebar-section {
                    margin-bottom: 30px;
                }
                .sidebar-section:last-child {
                    margin-bottom: 0;
                }
                .sidebar-title {
                    font-size: 14px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin: 0 0 15px 0;
                }
                .sidebar-tab {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 15px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    color: #666;
                    font-size: 15px;
                    text-align: left;
                    transition: all 0.3s;
                }
                .sidebar-tab:hover {
                    background: #f8f9fa;
                }
                .sidebar-tab.active {
                    background: #ff6b6b;
                    color: white;
                    font-weight: 500;
                }
                .tab-icon {
                    font-size: 20px;
                }
                .tab-badge {
                    margin-left: auto;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 12px;
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .stat-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
                .stat-value {
                    display: block;
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                }
                .stat-label {
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }

                /* Main Content Panel - FIXED: Proper scrolling container */
                .admin-content {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
                    overflow-y: auto; /* Enable vertical scrolling */
                    overflow-x: hidden; /* Prevent horizontal scrolling */
                    min-height: 0; /* Important for Firefox */
                }

                /* Form Styles */
                .form-card {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 30px;
                    margin-bottom: 30px;
                }
                .form-title {
                    margin: 0 0 25px 0;
                    font-size: 22px;
                    color: #333;
                }
                .menu-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #333;
                    font-size: 14px;
                }
                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                    transition: border-color 0.3s;
                }
                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #ff6b6b;
                }
                .file-upload {
                    position: relative;
                }
                .file-upload input[type="file"] {
                    display: none;
                }
                .upload-button {
                    display: inline-block;
                    padding: 12px 20px;
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #666;
                    font-size: 14px;
                    text-align: center;
                    width: 100%;
                }
                .upload-button:hover {
                    background: #f8f9fa;
                }
                .image-preview {
                    margin-top: 10px;
                }
                .preview-container {
                    margin-top: 8px;
                }
                .preview-image {
                    max-width: 200px;
                    max-height: 200px;
                    border-radius: 8px;
                    border: 2px solid #e0e0e0;
                    object-fit: cover;
                }
                .form-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }
                .submit-button {
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 15px;
                    transition: background 0.3s;
                }
                .submit-button:hover {
                    background: #ff5252;
                }
                .cancel-button {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 15px;
                    transition: background 0.3s;
                }
                .cancel-button:hover {
                    background: #5a6268;
                }

                /* Menu Items List */
                .menu-items-list {
                    margin-top: 40px;
                }
                .list-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    position: sticky;
                    top: 0;
                    background: white;
                    padding: 10px 0;
                    z-index: 10;
                }
                .list-header h2 {
                    margin: 0;
                    font-size: 22px;
                    color: #333;
                }
                .refresh-button {
                    background: white;
                    border: 2px solid #e0e0e0;
                    color: #666;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .refresh-button:hover {
                    background: #f8f9fa;
                }

                /* FIXED: Multi-column grid layout - 3-4 columns based on screen width */
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 25px;
                }
                
                .menu-item-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #e0e0e0;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .item-image-container {
                    height: 180px;
                    overflow: hidden;
                    position: relative;
                }
                
                .item-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s;
                }
                
                .menu-item-card:hover .item-image {
                    transform: scale(1.05);
                }
                
                .item-content {
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                }
                
                .item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                
                .item-name {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                    flex: 1;
                    margin-right: 15px;
                }
                
                .item-price {
                    font-size: 20px;
                    font-weight: 600;
                    color: #ff6b6b;
                    white-space: nowrap;
                }
                
                .item-description {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.5;
                    margin: 0 0 15px 0;
                    flex-grow: 1;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .item-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                }
                
                .item-category {
                    background: #e9ecef;
                    color: #495057;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .item-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .edit-button {
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .edit-button:hover {
                    background: #2980b9;
                }
                
                .delete-button {
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 6px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                }
                
                .delete-button:hover {
                    background: #c0392b;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                    background: #f8f9fa;
                    border-radius: 12px;
                    margin: 20px 0;
                }

                /* Order Management Styles */
                .order-management {
                    height: 100%;
                }
                
                .orders-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    position: sticky;
                    top: 0;
                    background: white;
                    padding: 10px 0;
                    z-index: 10;
                }
                
                .orders-header h2 {
                    margin: 0;
                    font-size: 22px;
                    color: #333;
                }
                
                .subtitle {
                    margin: 5px 0 0 0;
                    color: #666;
                    font-size: 14px;
                }
                
                .filter-toggle {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .filter-label {
                    font-size: 14px;
                    color: #666;
                }
                
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 26px;
                }
                
                .toggle-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .toggle-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }
                
                .toggle-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                
                input:checked + .toggle-slider {
                    background-color: #ff6b6b;
                }
                
                input:checked + .toggle-slider:before {
                    transform: translateX(24px);
                }

                .orders-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .order-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e0e0e0;
                    padding: 25px;
                }
                
                .order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .order-number {
                    margin: 0 0 10px 0;
                    font-size: 18px;
                    color: #333;
                }
                
                .order-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    font-size: 13px;
                    color: #666;
                }
                
                .customer-name,
                .order-date,
                .table-number {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                
                .order-status-section {
                    text-align: right;
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 6px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 10px;
                }
                
                .status-badge.preparing {
                    background: #fff3cd;
                    color: #856404;
                }
                
                .status-badge.ready {
                    background: #d4edda;
                    color: #155724;
                }
                
                .status-badge.completed {
                    background: #e2e3e5;
                    color: #383d41;
                }
                
                .order-total {
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                }
                
                .order-items {
                    margin-bottom: 25px;
                }
                
                .order-items h4 {
                    margin: 0 0 15px 0;
                    font-size: 16px;
                    color: #333;
                }
                
                .order-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 12px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .order-item:last-child {
                    border-bottom: none;
                }
                
                .item-quantity {
                    background: #f8f9fa;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-weight: 600;
                    color: #333;
                }
                
                .item-name {
                    flex: 1;
                    color: #333;
                }
                
                .item-price {
                    font-weight: 600;
                    color: #ff6b6b;
                }
                
                .order-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 20px;
                    border-top: 1px solid #e0e0e0;
                }
                
                .status-controls {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .status-select {
                    padding: 8px 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                }
                
                .complete-button {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 25px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    font-size: 14px;
                    transition: background 0.3s;
                }
                
                .complete-button:hover:not(:disabled) {
                    background: #218838;
                }
                
                .complete-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
                
                .complete-button.completed {
                    background: #6c757d;
                }

                /* Animations */
                @keyframes slideIn {
                    from {
                        transform: translateY(-10px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                /* Responsive Design */
                @media (max-width: 1200px) {
                    .admin-main {
                        grid-template-columns: 1fr;
                    }
                    .admin-sidebar {
                        position: static;
                    }
                    .items-grid {
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    }
                }

                @media (max-width: 768px) {
                    .admin-header {
                        padding: 20px;
                        margin: 10px 10px 15px 10px;
                    }
                    .header-content {
                        flex-direction: column;
                        gap: 15px;
                        align-items: flex-start;
                    }
                    .user-info {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .admin-main {
                        margin: 0 10px 10px 10px;
                        gap: 15px;
                    }
                    .admin-content {
                        padding: 20px;
                    }
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                    .items-grid {
                        grid-template-columns: 1fr;
                    }
                    .order-header {
                        flex-direction: column;
                        gap: 15px;
                    }
                    .order-status-section {
                        text-align: left;
                        width: 100%;
                    }
                    .order-footer {
                        flex-direction: column;
                        gap: 15px;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </div>
    );
};

export default Admin;
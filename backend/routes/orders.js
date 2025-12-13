const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('items.menuItem');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    console.log('Received order data:', req.body);
    
    // Process items - handle both regular items and add-ons
    const items = req.body.items.map(item => {
      console.log('Processing item:', item);
      
      // If it's an add-on (no valid ObjectId or has isAddon flag)
      if (item.isAddon || !item.menuItem || typeof item.menuItem === 'string') {
        return {
          itemName: item.itemName || item.menuItem?.name || 'Unknown Item',
          itemPrice: item.itemPrice || item.menuItem?.price || 0,
          price: item.itemPrice || item.menuItem?.price || 0,
          quantity: item.quantity
        };
      }
      
      // Regular menu item from database
      return {
        menuItem: item.menuItem,
        itemName: item.itemName || item.menuItem?.name || 'Unknown Item',
        itemPrice: item.itemPrice || item.menuItem?.price || item.price || 0,
        price: item.itemPrice || item.menuItem?.price || item.price || 0,
        quantity: item.quantity
      };
    });

    const order = new Order({
      customerName: req.body.customerName,
      items: items,
      totalAmount: req.body.totalAmount,
      tableNumber: req.body.tableNumber,
      paymentMethod: req.body.paymentMethod,
      orderType: req.body.orderType
    });

    const newOrder = await order.save();
    // Populate the order before sending response
    const populatedOrder = await Order.findById(newOrder._id).populate('items.menuItem');
    console.log('Order saved successfully:', populatedOrder);
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ 
      message: 'Error creating order', 
      error: error.message,
      details: error.errors
    });
  }
});

// Update order status
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only update status if it's one of the allowed values
    const allowedStatuses = ['preparing', 'ready', 'completed'];
    if (req.body.status && allowedStatuses.includes(req.body.status)) {
      order.status = req.body.status;
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('items.menuItem');
    res.json(populatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: false
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  itemName: {
    type: String,
    required: false
  },
  itemPrice: {
    type: Number,
    required: false
  }
});

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['preparing', 'ready', 'completed'], 
    default: 'preparing' 
  },
  tableNumber: {
    type: Number,
    required: false
  },
  paymentMethod: {
    type: String,
    required: false
  },
  orderType: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
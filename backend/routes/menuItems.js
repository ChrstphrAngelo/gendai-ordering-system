const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const upload = require('../config/upload'); // Adjust path as needed

// Get all menu items
router.get('/', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single menu item
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create menu item with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const menuItem = new MenuItem({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.file ? req.file.filename : '' // Save filename if file uploaded
    });

    const newMenuItem = await menuItem.save();
    res.status(201).json(newMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update menu item with optional image upload
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Update fields
    if (req.body.name != null) menuItem.name = req.body.name;
    if (req.body.description != null) menuItem.description = req.body.description;
    if (req.body.price != null) menuItem.price = req.body.price;
    if (req.body.category != null) menuItem.category = req.body.category;
    if (req.body.available != null) menuItem.available = req.body.available;
    
    // Update image if new file uploaded
    if (req.file) {
      menuItem.image = req.file.filename;
    } else if (req.body.image && req.body.image !== '') {
      // If image is a string (from editing without changing image)
      menuItem.image = req.body.image;
    }

    const updatedMenuItem = await menuItem.save();
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete menu item
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
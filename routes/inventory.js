import express from 'express';
import Item from '../models/Item.js';
import Customer from '../models/Customer.js';

const router = express.Router();

// GET items
router.get('/items', async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

// POST new item
router.post('/items', async (req, res) => {
  const item = new Item(req.body);
  await item.save();
  res.json(item);
});

// GET customers
router.get('/customers', async (req, res) => {
  const customers = await Customer.find();
  res.json(customers);
});

// POST new customer
router.post('/customers', async (req, res) => {
  const customer = new Customer(req.body);
  await customer.save();
  res.json(customer);
});

export default router;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventory'); // <-- ✅ import your custom routes

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// ✅ Attach your API endpoints
app.use('/api', inventoryRoutes);

// Sample route (optional)
app.get('/', (req, res) => {
  res.send('Warehouse API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

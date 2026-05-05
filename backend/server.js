const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/pickups', require('./routes/pickups'));

app.get('/', (req, res) => {
  res.json({
    message: 'CleanSlate API is running',
    version: '2.0.0',
    endpoints: ['/api/auth', '/api/orders', '/api/payments', '/api/pickups']
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 CleanSlate server running on port ${PORT}`);
});

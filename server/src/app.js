const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const lobbyRoutes = require('./routes/lobby.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.RP_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'TasteSync API Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;

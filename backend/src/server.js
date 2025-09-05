const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5177', 
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176',
    'https://taskmanagement-virid.vercel.app',
    /^https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// MongoDB Atlas Connection
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://pgoevenscheduler_db_user:taskmanager@cluster0t.wm3lhps.mongodb.net/taskmanager?retryWrites=true&w=majority&appName=Cluster0t";

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((err) => console.error('MongoDB connection error:', err));

// Import routes
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to TaskManager API' });
});

// Serve test.html
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, '../test.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}`);
    setTimeout(() => {
      server.close();
      server.listen(PORT + 1);
    }, 1000);
  } else {
    console.error('Server error:', error);
  }
});

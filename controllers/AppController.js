// controllers/AppController.js

const mongoose = require('mongoose');
const { isAlive } = require('../utils/redis');

const AppController = {
  async getStatus(req, res) {
    try {
      const redisAlive = await isAlive();
      const dbAlive = mongoose.connection.readyState === 1; // Check if MongoDB connection is open
      
      res.status(200).json({
        redis: redisAlive,
        db: dbAlive,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getStats(req, res) {
    try {
      // Count users and files
      const userCount = await mongoose.connection.db.collection('users').countDocuments();
      const fileCount = await mongoose.connection.db.collection('files').countDocuments();
      
      res.status(200).json({
        users: userCount,
        files: fileCount,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = AppController;

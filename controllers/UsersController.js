const mongoose = require('mongoose');
const redisClient = require('../utils/redis');

const UsersController = {
  async postNew(req, res) {
    // Existing postNew method
  },

  async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await mongoose.connection.db.collection('users').findOne({ _id: mongoose.Types.ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: user._id, email: user.email });
  }
};

module.exports = UsersController;

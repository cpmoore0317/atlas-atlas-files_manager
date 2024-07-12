const crypto = require('crypto');
const mongoose = require('mongoose');

const UsersController = {
  async postNew(req, res) {
    try {
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const existingUser = await mongoose.connection.db.collection('users').findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }

      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      const result = await mongoose.connection.db.collection('users').insertOne({ email, password: hashedPassword });

      res.status(201).json({
        id: result.insertedId,
        email,
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};

module.exports = UsersController;

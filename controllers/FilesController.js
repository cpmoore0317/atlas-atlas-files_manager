// controllers/FilesController.js

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const redisClient = require('../utils/redis');
const mongoose = require('mongoose');

const FilesController = {
  async postUpload(req, res) {
    // ... (existing code for postUpload)
  },

  async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await mongoose.connection.db.collection('files').findOne({
      _id: mongoose.Types.ObjectId(fileId),
      userId: mongoose.Types.ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  },

  async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0';
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    const files = await mongoose.connection.db.collection('files').aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId), parentId: parentId === '0' ? 0 : mongoose.Types.ObjectId(parentId) } },
      { $skip: page * pageSize },
      { $limit: pageSize }
    ]).toArray();

    return res.status(200).json(files);
  },

  async putPublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await mongoose.connection.db.collection('files').findOne({
      _id: mongoose.Types.ObjectId(fileId),
      userId: mongoose.Types.ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await mongoose.connection.db.collection('files').updateOne(
      { _id: mongoose.Types.ObjectId(fileId), userId: mongoose.Types.ObjectId(userId) },
      { $set: { isPublic: true } }
    );

    const updatedFile = await mongoose.connection.db.collection('files').findOne({
      _id: mongoose.Types.ObjectId(fileId),
      userId: mongoose.Types.ObjectId(userId)
    });

    return res.status(200).json(updatedFile);
  },

  async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;
    const file = await mongoose.connection.db.collection('files').findOne({
      _id: mongoose.Types.ObjectId(fileId),
      userId: mongoose.Types.ObjectId(userId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    await mongoose.connection.db.collection('files').updateOne(
      { _id: mongoose.Types.ObjectId(fileId), userId: mongoose.Types.ObjectId(userId) },
      { $set: { isPublic: false } }
    );

    const updatedFile = await mongoose.connection.db.collection('files').findOne({
      _id: mongoose.Types.ObjectId(fileId),
      userId: mongoose.Types.ObjectId(userId)
    });

    return res.status(200).json(updatedFile);
  }
};

module.exports = FilesController;

// controllers/FilesController.js

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const redisClient = require('../utils/redis');
const mongoose = require('mongoose');
const imageThumbnail = require('image-thumbnail');
const Bull = require('bull');

// Create a Bull queue
const fileQueue = new Bull('fileQueue');

const FilesController = {
  async postUpload(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;
    if (!name || !type || !data) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const localPath = path.join('/tmp/files_manager', uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

    const fileDoc = {
      userId: mongoose.Types.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : mongoose.Types.ObjectId(parentId),
      localPath
    };

    const result = await mongoose.connection.db.collection('files').insertOne(fileDoc);
    const fileId = result.insertedId;

    if (type === 'image') {
      await fileQueue.add({ userId, fileId });
    }

    return res.status(201).json({ id: fileId, userId, name, type, isPublic, parentId });
  },

  // Other methods...
  
  async getFile(req, res) {
    const fileId = req.params.id;
    const size = req.query.size;

    const file = await mongoose.connection.db.collection('files').findOne({
      _id: mongoose.Types.ObjectId(fileId)
    });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (!file.isPublic) {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      const userId = await redisClient.get(`auth_${token}`);
      if (!userId || file.userId.toString() !== userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    let localPath = file.localPath;
    if (size) {
      localPath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(localPath);
    fileStream.pipe(res);
  }
};

module.exports = FilesController;

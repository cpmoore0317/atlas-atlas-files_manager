const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const redisClient = require('../utils/redis');
const mongoose = require('mongoose');

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

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await mongoose.connection.db.collection('files').findOne({ _id: mongoose.Types.ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: mongoose.Types.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === 0 ? 0 : mongoose.Types.ObjectId(parentId)
    };

    if (type === 'folder') {
      const newFile = await mongoose.connection.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(newFile.ops[0]);
    } else {
      const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
      const localPath = path.join(FOLDER_PATH, uuidv4());

      fs.mkdirSync(FOLDER_PATH, { recursive: true });
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

      fileDocument.localPath = localPath;
      const newFile = await mongoose.connection.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(newFile.ops[0]);
    }
  }
};

module.exports = FilesController;

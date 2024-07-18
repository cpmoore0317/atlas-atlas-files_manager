// worker.js

const Bull = require('bull');
const mongoose = require('mongoose');
const fs = require('fs');
const imageThumbnail = require('image-thumbnail');
const redisClient = require('./utils/redis');
const path = require('path');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/files_manager', { useNewUrlParser: true, useUnifiedTopology: true });

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    return done(new Error('Missing fileId'));
  }

  if (!userId) {
    return done(new Error('Missing userId'));
  }

  const file = await mongoose.connection.db.collection('files').findOne({
    _id: mongoose.Types.ObjectId(fileId),
    userId: mongoose.Types.ObjectId(userId)
  });

  if (!file) {
    return done(new Error('File not found'));
  }

  const sizes = [500, 250, 100];
  for (const size of sizes) {
    const options = { width: size };
    const thumbnail = await imageThumbnail(file.localPath, options);
    const thumbnailPath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }

  done();
});

console.log('Worker is running');

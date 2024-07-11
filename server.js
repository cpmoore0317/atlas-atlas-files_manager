// server.js

const express = require('express');
const mongoose = require('mongoose');
const { isAlive } = require('./utils/redis'); // Import the `isAlive` function

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/atlas_files_manager', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));

// Load routes
const routes = require('./routes/index');
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

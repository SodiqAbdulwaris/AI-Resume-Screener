const config = require('./config/env');
const mongoose = require('mongoose');
const app = require('./app');

const PORT = config.port || 5000;

// We connect to MongoDB first. The server will only spin up if the connection succeeds.
console.log('Connecting to MongoDB...');
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    console.log('Connected to MongoDB successfully.');

    app.listen(PORT, () => {
      console.log(`Server running successfully on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error. Process terminating...', err);
    process.exit(1); // Forces Railway to restart or flag a bad deployment instead of serving broken 404s
  });

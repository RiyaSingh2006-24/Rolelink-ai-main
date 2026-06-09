const mongoose = require('mongoose');

const connectDatabase = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(uri, {
    dbName: 'job',
    serverSelectionTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS || 10000)
  });

  console.log('MongoDB connected');
};

module.exports = connectDatabase;

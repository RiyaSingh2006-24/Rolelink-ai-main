const mongoose = require('mongoose');

const connectDatabase = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(uri, {
    dbName: 'job'
  });

  console.log('MongoDB connected');
};

module.exports = connectDatabase;

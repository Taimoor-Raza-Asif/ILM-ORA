// auth-service/src/utils/connectMongo.js
import mongoose from 'mongoose';
export const connectMongo = async uri => {
  const mongoUri = uri || process.env.MONGO_URI || 'mongodb://localhost:27017/ilm-ora';
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB (auth-service)');
  } catch (err) {
    console.error('Failed to connect to MongoDB (auth-service)', err);
    throw err;
  }
};
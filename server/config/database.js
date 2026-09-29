import mongoose from 'mongoose';

let isConnected = false;

export const connectDb = async () => {
  if (isConnected) return;

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI environment variable is not set');

    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ Connected to MongoDB Atlas!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

export default mongoose;
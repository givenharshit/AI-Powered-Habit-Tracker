import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let mongodInstance = null;

export const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI?.trim();

    if (uri) {
      console.log(`[DB] Attempting connection to configured MongoDB URI...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] Connected to MongoDB at ${mongoose.connection.host}`);
      return;
    }

    // Fallback: If no URI provided, attempt local default, then MongoMemoryServer
    try {
      console.log(`[DB] No MONGODB_URI set. Trying default localhost:27017/ai-habit-tracker...`);
      await mongoose.connect('mongodb://localhost:27017/ai-habit-tracker', {
        serverSelectionTimeoutMS: 2000,
      });
      console.log(`[DB] Connected to local MongoDB instance.`);
      return;
    } catch {
      console.log(`[DB] Local MongoDB not available. Initializing MongoMemoryServer...`);
    }

    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    uri = mongodInstance.getUri();
    await mongoose.connect(uri);
    console.log(`[DB] Connected to embedded in-memory MongoDB (${uri})`);
  } catch (error) {
    console.error(`[DB Error] Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (error) {
    console.error('[DB Error] Error closing DB:', error);
  }
};

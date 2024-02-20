import { logger } from '../configs/logger';
import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;

export const connectToDatabase = () => {
  mongoose
    .connect(MONGODB_URL.includes('<password>') ? MONGODB_URL.replace('<password>', process.env.MONGODB_PASSWORD) : MONGODB_URL)
    .then(() => {
      logger.info('MongoDB is connected')
    })
    .catch((error) => {
      return logger.error('MongoDB is not connected', {error: error.message})
    })
};
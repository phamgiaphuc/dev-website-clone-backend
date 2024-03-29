import express, { Request, Response } from 'express';
import 'dotenv/config';
import { connectToDatabase } from './database/connect.db';
import cors from 'cors';
import { corsOption } from './configs/cors';
import { api_v1s } from './routes/v1';
import { logger } from './configs/logger';
import cookieParser from 'cookie-parser';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { configFirebase } from './configs/firebase';

const server = express();
const PORT = process.env.PORT || 8000;

server.use(cookieParser());
server.use(express.json());
server.use(cors(corsOption));
server.use(loggerMiddleware);

server.use('/v1', api_v1s);

const startTheServer = () => {
  connectToDatabase();
  configFirebase();
  server.listen(PORT, () => {
    logger.info(`Server is listening on http://localhost:${PORT}`);
  })
}

startTheServer();

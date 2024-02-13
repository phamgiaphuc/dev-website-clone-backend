import express, { Request, Response } from 'express';
import 'dotenv/config';
import { connectToDatabase } from './database/connect';
import cors from 'cors';
import { corsOption } from './configs/cors';
import { api_v1s } from './routes/v1';
import { logger } from './configs/logger';
import cookieParser from 'cookie-parser';
import firebaseAuthKey from './jsons/dev-website-clone-firebase-adminsdk-jz6bz-afc58301c1.json';
import admin from 'firebase-admin';
import { loggerMiddleware } from './middlewares/loggerMiddleware';

// Variables
const server = express();
const PORT = process.env.PORT || 8000;
admin.initializeApp({
  credential: admin.credential.cert(firebaseAuthKey as admin.ServiceAccount)
});

// Middlewares
server.use(cookieParser());
server.use(express.json());
server.use(cors(corsOption));
server.use(loggerMiddleware);

// Routes
server.use('/v1', api_v1s);

// Server initialization
const startTheServer = () => {
  connectToDatabase();
  server.listen(PORT, () => {
    logger.info(`Server is listening on http://localhost:${PORT}`);
  })
}

startTheServer();

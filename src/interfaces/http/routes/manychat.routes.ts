import { Router } from 'express';
import { manychatController } from '../controllers/manychat.controller';
import { manychatAuthMiddleware } from '../middlewares/manychatAuth.middleware';

export const manychatRouter = Router();

// Webhook seguro (secret header)
manychatRouter.post('/', manychatAuthMiddleware, manychatController.handleIncoming);

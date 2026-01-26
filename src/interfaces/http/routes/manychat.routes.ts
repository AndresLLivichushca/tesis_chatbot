import { Router } from 'express';
// Importamos la función exacta que exportaste en el controlador
import { webhookManychat } from '../controllers/manychat.controller';
import { manychatAuthMiddleware } from '../middlewares/manychatAuth.middleware';

export const manychatRouter = Router();

/**
 * Webhook seguro para ManyChat
 * Usamos la función 'handleIncoming' directamente
 */
manychatRouter.post('/', manychatAuthMiddleware, webhookManychat);
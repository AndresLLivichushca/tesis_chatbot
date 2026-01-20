import { Router } from 'express';
// Importamos la función exacta que exportaste en el controlador
import { handleIncoming } from '../controllers/manychat.controller';
import { manychatAuthMiddleware } from '../middlewares/manychatAuth.middleware';

export const manychatRouter = Router();

/**
 * Webhook seguro para ManyChat
 * Usamos la función 'handleIncoming' directamente
 */
manychatRouter.post('/', manychatAuthMiddleware, handleIncoming);
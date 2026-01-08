"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manychatAuthMiddleware = void 0;
const env_1 = require("../../../config/env");
const env = (0, env_1.loadEnv)();
/**
 * ManyChat -> Node: validar header secreto
 * ManyChat puede enviar headers custom en External Request.
 */
const manychatAuthMiddleware = (req, res, next) => {
    const secret = req.header('x-webhook-secret');
    if (!secret || secret !== env.MANYCHAT_WEBHOOK_SECRET) {
        return res.status(401).json({
            ok: false,
            error: 'Unauthorized webhook',
            requestId: req.requestId,
        });
    }
    next();
};
exports.manychatAuthMiddleware = manychatAuthMiddleware;

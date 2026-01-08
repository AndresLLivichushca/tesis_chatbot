"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const manychat_routes_1 = require("./interfaces/http/routes/manychat.routes");
const requestId_middleware_1 = require("./interfaces/http/middlewares/requestId.middleware");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    app.use((0, express_rate_limit_1.default)({ windowMs: 60000, max: 120 }));
    app.use(requestId_middleware_1.requestIdMiddleware);
    app.get('/health', (_req, res) => res.json({ ok: true, service: 'isp-chatbot-backend' }));
    app.use('/webhooks/manychat', manychat_routes_1.manychatRouter);
    app.use((err, _req, res, _next) => {
        console.error('[ERROR]', err);
        res.status(err?.status || 500).json({ error: err?.message || 'Server error' });
    });
    return app;
};
exports.createApp = createApp;

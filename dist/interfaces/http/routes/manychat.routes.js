"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manychatRouter = void 0;
const express_1 = require("express");
const manychat_controller_1 = require("../controllers/manychat.controller");
const manychatAuth_middleware_1 = require("../middlewares/manychatAuth.middleware");
exports.manychatRouter = (0, express_1.Router)();
// Webhook seguro (secret header)
exports.manychatRouter.post('/', manychatAuth_middleware_1.manychatAuthMiddleware, manychat_controller_1.manychatController.handleIncoming);

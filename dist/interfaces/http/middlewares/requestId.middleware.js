"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const crypto_1 = __importDefault(require("crypto"));
const requestIdMiddleware = (req, _res, next) => {
    const incoming = req.header('x-request-id');
    req.requestId = incoming || crypto_1.default.randomUUID();
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;

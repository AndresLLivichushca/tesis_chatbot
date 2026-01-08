"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeHttp = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../../config/env");
const env = (0, env_1.loadEnv)();
exports.makeHttp = axios_1.default.create({
    timeout: env.MAKE_TIMEOUT_MS,
    headers: {
        'Content-Type': 'application/json',
    },
});

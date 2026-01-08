"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logInfo = void 0;
const logInfo = (msg, extra) => {
    console.log(`[INFO] ${msg}`, extra ?? '');
};
exports.logInfo = logInfo;
const logError = (msg, extra) => {
    console.error(`[ERROR] ${msg}`, extra ?? '');
};
exports.logError = logError;

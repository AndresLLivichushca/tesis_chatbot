"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearTicketEnMake = void 0;
const env_1 = require("../../../config/env");
const make_client_1 = require("./make.client");
const env = (0, env_1.loadEnv)();
const crearTicketEnMake = async (payload) => {
    const { data } = await make_client_1.makeHttp.post(env.MAKE_TICKETS_WEBHOOK_URL, payload);
    return {
        ticketId: String(data?.ticketId ?? ''),
        estado: (data?.estado ?? 'ERROR'),
        mensaje: String(data?.mensaje ?? 'Ticket procesado'),
    };
};
exports.crearTicketEnMake = crearTicketEnMake;

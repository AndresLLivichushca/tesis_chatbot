"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarFacturasEnMake = void 0;
const env_1 = require("../../../config/env");
const make_client_1 = require("./make.client");
const env = (0, env_1.loadEnv)();
const consultarFacturasEnMake = async (payload) => {
    const { data } = await make_client_1.makeHttp.post(env.MAKE_FACTURAS_WEBHOOK_URL, payload);
    return {
        tieneDeuda: Boolean(data?.tieneDeuda),
        montoPendiente: Number(data?.montoPendiente ?? 0),
        fechaVencimiento: data?.fechaVencimiento ?? null,
        estadoServicio: (data?.estadoServicio ?? 'DESCONOCIDO'),
    };
};
exports.consultarFacturasEnMake = consultarFacturasEnMake;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultarEstadoServicioEnMake = void 0;
const env_1 = require("../../../config/env");
const make_client_1 = require("./make.client");
const env = (0, env_1.loadEnv)();
const consultarEstadoServicioEnMake = async (payload) => {
    const { data } = await make_client_1.makeHttp.post(env.MAKE_SERVICIO_WEBHOOK_URL, payload);
    return {
        estadoServicio: (data?.estadoServicio ?? 'DESCONOCIDO'),
        plan: data?.plan ?? null,
        ultimaConexion: data?.ultimaConexion ?? null,
        mensaje: data?.mensaje ?? null,
    };
};
exports.consultarEstadoServicioEnMake = consultarEstadoServicioEnMake;

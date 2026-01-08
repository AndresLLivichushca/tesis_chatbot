"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manychatController = void 0;
const logger_1 = require("../../../shared/logger");
const make_facturas_service_1 = require("../../../core/services/make/make.facturas.service");
const make_servicio_service_1 = require("../../../core/services/make/make.servicio.service");
const make_tickets_service_1 = require("../../../core/services/make/make.tickets.service");
const isCedulaValida = (cedula) => /^[0-9]{10}$/.test(cedula);
exports.manychatController = {
    handleIncoming: async (req, res) => {
        const requestId = req.requestId;
        try {
            const body = req.body;
            const startedAt = Date.now();
            (0, logger_1.logInfo)(`Incoming ManyChat`, { requestId, body });
            if (!body?.action) {
                return res.status(400).json({ ok: false, error: 'action es requerida', requestId });
            }
            // Para los 3 casos, pedimos cédula
            const cedula = String(body.cedula ?? '').trim();
            if (!cedula || !isCedulaValida(cedula)) {
                return res.status(400).json({ ok: false, error: 'Cédula inválida (10 dígitos)', requestId });
            }
            // Router por "action"
            if (body.action === 'FACTURAS_ESTADO') {
                const data = await (0, make_facturas_service_1.consultarFacturasEnMake)({ cedula });
                (0, logger_1.logInfo)(`FACTURAS_ESTADO OK`, { requestId, ms: Date.now() - startedAt });
                return res.json({
                    ok: true,
                    requestId,
                    ...data,
                });
            }
            if (body.action === 'SERVICIO_ESTADO') {
                const data = await (0, make_servicio_service_1.consultarEstadoServicioEnMake)({ cedula });
                (0, logger_1.logInfo)(`SERVICIO_ESTADO OK`, { requestId, ms: Date.now() - startedAt });
                return res.json({
                    ok: true,
                    requestId,
                    ...data,
                });
            }
            if (body.action === 'TICKET_CREAR') {
                const tipoProblema = body.tipoProblema;
                if (!tipoProblema) {
                    return res.status(400).json({
                        ok: false,
                        error: 'tipoProblema es requerido',
                        requestId,
                    });
                }
                const data = await (0, make_tickets_service_1.crearTicketEnMake)({
                    cedula,
                    telefono: body.telefono,
                    tipoProblema,
                    descripcion: body.descripcion,
                    ubicacion: body.ubicacion,
                });
                (0, logger_1.logInfo)(`TICKET_CREAR OK`, { requestId, ms: Date.now() - startedAt });
                return res.json({
                    ok: true,
                    requestId,
                    ...data,
                });
            }
            return res.status(400).json({ ok: false, error: 'action no soportada', requestId });
        }
        catch (err) {
            (0, logger_1.logError)(`ManyChat handler error`, {
                requestId,
                message: err?.message,
                response: err?.response?.data,
            });
            // 502: falla de dependencia externa (Make/Odoo)
            return res.status(502).json({
                ok: false,
                error: 'No se pudo completar la operación (dependencia externa).',
                requestId,
            });
        }
    },
};

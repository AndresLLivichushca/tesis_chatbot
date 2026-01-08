"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeIntent = void 0;
const routeIntent = (text) => {
    const t = (text || '').toLowerCase();
    if (/(factura|pagar|saldo|vencer)/.test(t)) {
        return { name: 'consulta_factura', entities: {} };
    }
    if (/(soporte|sin internet|lento|fallas|ticket)/.test(t)) {
        return { name: 'crear_ticket', entities: { issue: 'conectividad' } };
    }
    return { name: 'fallback', entities: {} };
};
exports.routeIntent = routeIntent;

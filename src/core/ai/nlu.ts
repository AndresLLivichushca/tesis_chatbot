export const routeIntent = (text: string) => {
  const t = (text || '').toLowerCase();

  if (/(factura|pagar|saldo|vencer)/.test(t)) {
    return { name: 'consulta_factura', entities: {} as Record<string, string> };
  }
  if (/(soporte|sin internet|lento|fallas|ticket)/.test(t)) {
    return { name: 'crear_ticket', entities: { issue: 'conectividad' } };
  }
  return { name: 'fallback', entities: {} as Record<string, string> };
};

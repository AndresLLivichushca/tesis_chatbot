import type { Request, Response } from 'express';
import { logError, logInfo } from '../../../shared/logger';
import { consultarFacturasEnMake } from '../../../core/services/make/make.facturas.service';
import { consultarEstadoServicioEnMake } from '../../../core/services/make/make.servicio.service';
import { crearTicketEnMake } from '../../../core/services/make/make.tickets.service';

type ManychatIncoming = {
  action: 'FACTURAS_ESTADO' | 'SERVICIO_ESTADO' | 'TICKET_CREAR';
  cedula?: string;

  telefono?: string;
  tipoProblema?: 'SIN_SERVICIO' | 'LENTO' | 'INTERMITENTE' | 'OTRO';
  descripcion?: string;
  ubicacion?: string;
};

const isCedulaValida = (cedula: string) => /^[0-9]{10}$/.test(cedula);

export const manychatController = {
  handleIncoming: async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;

    try {
      const body = req.body as ManychatIncoming;
      const startedAt = Date.now();

      logInfo('Incoming ManyChat', { requestId, body });

      if (!body?.action) {
        return res.status(400).json({
          ok: false,
          error: 'action es requerida',
          requestId,
        });
      }

      const cedula = String(body.cedula ?? '').trim();
      if (!cedula || !isCedulaValida(cedula)) {
        return res.status(400).json({
          ok: false,
          error: 'Cédula inválida (10 dígitos)',
          requestId,
        });
      }

      // ================= FACTURAS =================
      if (body.action === 'FACTURAS_ESTADO') {
        const data = await consultarFacturasEnMake({ cedula });

        logInfo('FACTURAS_ESTADO OK', {
          requestId,
          ms: Date.now() - startedAt,
        });

        return res.json({
          ok: true,
          requestId,
          data,
        });
      }

      // ================= SERVICIO =================
      if (body.action === 'SERVICIO_ESTADO') {
        const data = await consultarEstadoServicioEnMake({ cedula });

        logInfo('SERVICIO_ESTADO OK', {
          requestId,
          ms: Date.now() - startedAt,
        });

        return res.json({
          ok: true,
          requestId,
          data,
        });
      }

      // ================= TICKET =================
      if (body.action === 'TICKET_CREAR') {
        if (!body.tipoProblema) {
          return res.status(400).json({
            ok: false,
            error: 'tipoProblema es requerido',
            requestId,
          });
        }

        const data = await crearTicketEnMake({
          cedula,
          telefono: body.telefono,
          tipoProblema: body.tipoProblema,
          descripcion: body.descripcion,
          ubicacion: body.ubicacion,
        });

        logInfo('TICKET_CREAR OK', {
          requestId,
          ms: Date.now() - startedAt,
        });

        return res.json({
          ok: true,
          requestId,
          data,
        });
      }

      return res.status(400).json({
        ok: false,
        error: 'action no soportada',
        requestId,
      });

    } catch (err: any) {
      logError('ManyChat handler error', {
        requestId,
        message: err?.message,
        response: err?.response?.data,
      });

      return res.status(502).json({
        ok: false,
        error: 'No se pudo completar la operación (dependencia externa)',
        requestId,
      });
    }
  },
};

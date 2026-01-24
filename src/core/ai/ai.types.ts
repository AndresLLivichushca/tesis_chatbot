export type EstadoBot =
  | 'CONTINUAR'
  | 'FINALIZAR'
  | 'DIAGNOSTICO_AGOTADO';

export type IntencionUsuario =
  | 'SALDO'
  | 'FACTURA'
  | 'INTERNET'
  | 'SOPORTE'
  | 'GENERAL';

export interface RouterIAResponse {
  intencion: IntencionUsuario;
  mensaje?: string;
  finalizar: boolean;
}

export interface DiagnosticoIAResponse {
  mensaje: string;
  estado: EstadoBot;
  paso_incremento: number;
  intentos_incremento: number;
  ultimo_fue_falla: boolean;
  reset_paso: boolean;
  finalizar: boolean;
}

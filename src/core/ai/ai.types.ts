// ai.types.ts

export type EstadoDiagnostico =
  | 'CONTINUAR'
  | 'DIAGNOSTICO_AGOTADO';

export interface DiagnosticoIAResponse {
  mensaje: string;
  estado: EstadoDiagnostico;
  paso_incremento: number;
  intentos_incremento: number;
  ultimo_fue_falla: boolean;
  reset_paso: boolean;
  finalizar: boolean;
}

export function limpiarMensaje(mensaje: string): string {
  return mensaje
    .toLowerCase()
    .replace(/\n/g, ' ')
    .replace(/\bmenu\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

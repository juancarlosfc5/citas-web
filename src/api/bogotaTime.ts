// La API entrega fechas locales de America/Bogota sin zona ("YYYY-MM-DDTHH:mm[:ss]").
// Se tratan como texto para no depender de la zona horaria del navegador.
const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/;

export const bogotaToday = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

export function localDate(value: string): string {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) throw new Error(`Fecha local inválida: ${value}`);
  return match[1];
}

export function localTime(value: string): string {
  const match = LOCAL_DATE_TIME.exec(value);
  if (!match) throw new Error(`Hora local inválida: ${value}`);
  return match[2];
}

export function formatLocal(value: string): string {
  const match = LOCAL_DATE_TIME.exec(value);
  return match ? `${match[1]} · ${match[2]}` : value;
}

export function detectarDispositivo(userAgent: string): string {
  if (/iPhone|iPad|iPod/.test(userAgent)) return '📱 Safari en iPhone';
  if (/Android/.test(userAgent))          return '📱 Navegador en Android';
  if (/Mac/.test(userAgent))              return '🖥️ Navegador en Mac';
  if (/Windows/.test(userAgent))          return '💻 Navegador en Windows';
  return '🌐 Navegador desconocido';
}

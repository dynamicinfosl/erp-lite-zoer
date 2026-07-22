/**
 * Resolve FocusNFe relative file paths to absolute URLs.
 * Safe for browser and server.
 */
export function getFullFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return path.startsWith('/arquivos_development')
    ? `https://homologacao.focusnfe.com.br${path}`
    : `https://api.focusnfe.com.br${path}`;
}

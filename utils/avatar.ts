export const AVATAR_COLORS = [
  '#ED555C', '#2B2D42', '#FFD97A', '#88C896',
  '#E8854A', '#D4A050', '#3D9E6A', '#C85A4A', '#0881D1', '#6ED08C',
]

export const ROLE_LABELS: Record<string, string> = {
  kreatør: 'Kreativt team',
  rådgiver: 'Rådgiver',
  prosjektleder: 'Prosjektleder',
  designer: 'Designer',
  film: 'Film',
  drift: 'Drift',
}

export const PARTICIPANT_ROLES = new Set(['kreatør', 'rådgiver', 'prosjektleder'])

function nameHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  return Math.abs(h)
}

export function avatarUrl(name: string, size = 40, seed?: string): string {
  const s = seed || name
  const color = AVATAR_COLORS[nameHash(s) % AVATAR_COLORS.length]
  const initials = name
    .replace(/[^a-zA-ZæøåÆØÅ ]/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size / 2}" fill="${color}"/><text x="${size / 2}" y="${size * 0.64}" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="${size * 0.38}" fill="white">${initials}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// Returnerer en trygg http(s)-URL, eller null hvis lenken er ugyldig/farlig
// (blokkerer javascript:, data:, vbscript: osv. som ellers gir XSS i :href)
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let s = String(url).trim()
  if (!s) return null
  if (/^(javascript|data|vbscript|file):/i.test(s)) return null
  // Legg på https:// hvis ingen protokoll er oppgitt
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s
  try {
    const parsed = new URL(s)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Nå nettopp'
  if (diff < 3600) return `${Math.floor(diff / 60)}m siden`
  if (diff < 86400) return `${Math.floor(diff / 3600)}t siden`
  return `${Math.floor(diff / 86400)}d siden`
}

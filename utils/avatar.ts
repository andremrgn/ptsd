export const AVATAR_COLORS = [
  '#ED555C', '#2B2D42', '#FFD97A', '#88C896',
  '#E8854A', '#D4A050', '#3D9E6A', '#C85A4A', '#0881D1', '#6ED08C',
]

export const ROLE_LABELS: Record<string, string> = {
  kreatør: 'Kreatør',
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
  // Firkantet «ikon» (Win98 har ingen runde bilder)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${color}"/><text x="${size / 2}" y="${size * 0.66}" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-weight="700" font-size="${size * 0.42}" fill="white">${initials}</text></svg>`
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

// Trekker ut en søkbar frase fra en postetekst: fjerner emojis, hopper over
// korte overskrifter og kulepunkt-markører, og tar første faktiske tekstlinje
// (første setning). Slik unngår vi at f.eks. en tittel som «Potte tett» havner
// i søket i stedet for selve annonseteksten.
function extractAdPhrase(text: string): string {
  const clean = (s: string) => s
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{2190}-\u{21FF}\u{2022}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const lines = (text || '')
    .split(/\n+/)
    .map(l => clean(l.replace(/^[\s•·*\-–]+/, '')))
    .filter(Boolean)
  // Første «innholdslinje»: har setningstegn eller er lang nok (hopper over korte titler)
  const line = lines.find(l => /[.!?]/.test(l) || l.length >= 20) || lines[0] || ''
  // Ta første setning for et presist frasesøk
  const sentence = line.match(/^(.{10,}?[.!?])(\s|$)/)
  return (sentence ? sentence[1] : line).trim()
}

// Bygger en dyplenke inn i Metas (offentlige) annonsebibliotek som søker opp
// uttaket ut fra selve annonseteksten (nøkkelordsøk på første tekstlinje).
export function metaAdLibraryUrl(text: string, country = 'NO'): string {
  const params = new URLSearchParams({
    active_status: 'all',
    ad_type: 'all',
    country,
    media_type: 'all',
    q: extractAdPhrase(text),
  })
  return `https://www.facebook.com/ads/library/?${params.toString()}`
}

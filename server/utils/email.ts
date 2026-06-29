// Felles e-postmal for Sølvposten-utsendinger (Resend).
// Auto-importeres i Nitro server-kontekst.

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface MailOptions {
  firstName: string
  bodyHtml: string        // avsnitt mellom hilsen og knapp (utvikler-kontrollert HTML)
  ctaUrl: string
  ctaText: string
  footnote?: string       // valgfri liten merknad under knappen
}

export function renderMail({ firstName, bodyHtml, ctaUrl, ctaText, footnote }: MailOptions): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;color:#2B2D42">
      <p style="font-size:1.4rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:1.5rem">
        Hei ${escapeHtml(firstName)} 👋
      </p>
      ${bodyHtml}
      <a href="${ctaUrl}"
        style="display:inline-block;background:#ED555C;color:#ffffff;font-family:system-ui,sans-serif;font-size:0.85rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:0.85rem 1.75rem;border-radius:2px">
        ${ctaText}
      </a>
      ${footnote ? `<p style="font-size:0.85rem;line-height:1.6;color:#666;margin-top:1.75rem">${footnote}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:2rem 0 1rem">
      <p style="font-size:0.8rem;color:#999">
        Hilsen Sølvposten, et initiativ for faglig stolthet
      </p>
    </div>
  `
}

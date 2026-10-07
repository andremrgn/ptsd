// Felles e-postmal for Sølvposten-utsendinger (Resend), i samme Windows 98-stil som nettsiden.
// Bygget med tabeller, rammer og inline-stiler (ikke box-shadow/flex), så den ser lik ut
// i Gmail, Outlook og Apple Mail. Auto-importeres i Nitro server-kontekst.

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Pikselfonten lastes der e-postklienten støtter det (Apple Mail); ellers Tahoma
const FONT = `'W98 Sans',Tahoma,'MS Sans Serif',Verdana,Arial,sans-serif`
const TEXT = `font-family:${FONT};font-size:11px;line-height:14px;color:#000000;`
// 98.css-bevels som rammer: [ytre, indre] med farger for topp/venstre og bunn/høyre
const RAISED = 'border-top:1px solid #ffffff;border-left:1px solid #ffffff;border-right:1px solid #0a0a0a;border-bottom:1px solid #0a0a0a;'
const RAISED_INNER = 'border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #808080;border-bottom:1px solid #808080;'
const SUNKEN_THIN = 'border-top:1px solid #808080;border-left:1px solid #808080;border-right:1px solid #dfdfdf;border-bottom:1px solid #dfdfdf;'

/** Vanlig avsnitt i mailen (innholdet er utvikler-kontrollert HTML) */
export function mailP(html: string): string {
  return `<p style="margin:0 0 11px;${TEXT}">${html}</p>`
}

/** Groupbox (fieldset med legend) som i Kontrollpanelet, med etset ramme */
export function mailGroupbox(legend: string, html: string): string {
  const lineTop = (side: 'left' | 'right') => side === 'left'
    ? '<div style="border-top:1px solid #808080;border-left:1px solid #808080"><div style="border-top:1px solid #ffffff;border-left:1px solid #ffffff;height:5px;font-size:0;line-height:0">&nbsp;</div></div>'
    : '<div style="border-top:1px solid #808080;border-right:1px solid #ffffff"><div style="border-top:1px solid #ffffff;border-right:1px solid #808080;height:5px;font-size:0;line-height:0">&nbsp;</div></div>'
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:4px 0 13px">
      <tr>
        <td width="8" valign="bottom" style="width:8px;padding:0">${lineTop('left')}</td>
        <td style="padding:0 3px;white-space:nowrap;${TEXT}" width="1">${escapeHtml(legend)}</td>
        <td valign="bottom" style="padding:0">${lineTop('right')}</td>
      </tr>
      <tr>
        <td colspan="3" style="padding:0">
          <div style="border-left:1px solid #808080;border-right:1px solid #ffffff;border-bottom:1px solid #ffffff">
            <div style="border-left:1px solid #ffffff;border-right:1px solid #808080;border-bottom:1px solid #808080;padding:6px 10px 8px">${html}</div>
          </div>
        </td>
      </tr>
    </table>`
}

function defaultButton(url: string, text: string): string {
  // Standardknapp (OK-knappen i en dialog): svart ring + 2 px bevel
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse">
      <tr><td style="border:1px solid #000000;padding:0;background:#c0c0c0">
        <a href="${url}" target="_blank" style="display:block;text-decoration:none;color:#000000;${RAISED}">
          <span style="display:block;${RAISED_INNER}padding:5px 18px;text-align:center;${TEXT}">${text}</span>
        </a>
      </td></tr>
    </table>`
}

/** Dager fra i dag (norsk tid) til fristen (YYYY-MM-DD), som i statuslinjen på nettsiden */
export function daysUntil(deadline: string, now = new Date()): number {
  const today = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' }) // YYYY-MM-DD
  return Math.round((Date.parse(deadline.slice(0, 10)) - Date.parse(today)) / 86400000)
}

/** Påminnelse om innleveringsfristen */
export function deadlineReminderMail(o: { appUrl: string; fullName: string; deadline: string; now?: Date }) {
  const days = daysUntil(o.deadline, o.now)
  const daysText = days === 1 ? '1 dag' : `${days} dager`
  const dateText = new Date(`${o.deadline.slice(0, 10)}T12:00:00Z`)
    .toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  const statusDays = days === 0 ? 'Innleveringsfrist i dag' : `${daysText} til innleveringsfrist`

  return {
    days,
    subject: days === 0 ? 'Siste dag i Sølvposten!' : `${daysText} igjen av Sølvposten`,
    html: renderMail({
      appUrl: o.appUrl,
      title: 'Påminnelse',
      preheader: `${daysText} igjen til fristen. Har du en postetekst du er stolt av?`,
      firstName: o.fullName.split(' ')[0],
      bodyHtml: [
        mailP(days === 0
          ? 'I dag er siste dag for å sende inn bidrag til Sølvposten.'
          : `Nå er det <b>${daysText}</b> igjen til fristen i Sølvposten.`),
        mailGroupbox('Frist', `
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" style="padding:0 10px 0 0;font-family:${FONT};font-size:33px;line-height:36px;color:#000080">${days}</td>
            <td valign="middle" style="padding:0;${TEXT}">${days === 1 ? 'dag' : 'dager'} igjen<br>Fristen er ${escapeHtml(dateText)}.</td>
          </tr></table>`),
        mailP('Har du en postetekst du er stolt av? Send den inn, det tar bare et par minutter :)'),
      ].join(''),
      ctaUrl: `${o.appUrl}/app/send-inn`,
      ctaText: 'Send inn bidrag…',
      status: ['Klar', statusDays, o.fullName],
    }),
  }
}

interface MailOptions {
  appUrl: string          // https://solvposten.vercel.app — lenker og bilder
  title: string           // tittellinjen blir «{title} - Sølvposten»
  preheader?: string      // forhåndsvisningstekst i innboksen
  firstName: string
  bodyHtml: string        // innhold mellom hilsen og knapp (bruk mailP/mailGroupbox)
  ctaUrl: string
  ctaText: string
  footnote?: string       // valgfri gul hjelpelapp under knappen
  status?: string[]       // feltene i statuslinjen, som nederst på nettsiden
}

export function renderMail(o: MailOptions): string {
  const status = (o.status?.length ? o.status : ['Klar'])
    .map((s, i) => `${i ? '<td width="2" style="width:2px;padding:0"></td>' : ''}<td style="${SUNKEN_THIN}padding:2px 4px;${TEXT}white-space:nowrap">${escapeHtml(s)}</td>`)
    .join('')

  return `<!doctype html>
<html lang="no">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<style>
  @font-face { font-family: 'W98 Sans'; src: url('${o.appUrl}/fonts/w98-sans.woff2') format('woff2'); font-weight: 400; }
  @font-face { font-family: 'W98 Sans'; src: url('${o.appUrl}/fonts/w98-sans-bold.woff2') format('woff2'); font-weight: 700; }
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
</style>
</head>
<body style="margin:0;padding:0;background:#c0c0c0">
${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${escapeHtml(o.preheader)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#c0c0c0" style="background:#c0c0c0">
  <tr><td align="center" style="padding:24px 12px">

    <!-- Vindu -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#c0c0c0"
      style="max-width:500px;background:#c0c0c0;border-collapse:separate;border-top:1px solid #dfdfdf;border-left:1px solid #dfdfdf;border-right:1px solid #0a0a0a;border-bottom:1px solid #0a0a0a">
      <tr><td style="padding:0">
        <div style="border-top:1px solid #ffffff;border-left:1px solid #ffffff;border-right:1px solid #808080;border-bottom:1px solid #808080;padding:2px">

          <!-- Tittellinje -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000080"
            style="background:#000080;background-image:linear-gradient(90deg,#000080,#1084d0)">
            <tr>
              <td width="16" valign="middle" style="width:16px;padding:2px 0 2px 3px"><img src="${o.appUrl}/mail/logo-white@2x.png" width="16" height="16" alt="" style="display:block;border:0"></td>
              <td valign="middle" style="padding:3px 4px;font-family:${FONT};font-size:11px;line-height:14px;font-weight:700;color:#ffffff">${escapeHtml(o.title)} - Sølvposten</td>
              <td width="16" valign="middle" align="right" style="width:16px;padding:2px 2px 2px 0"><img src="${o.appUrl}/mail/close@2x.png" width="16" height="14" alt="" style="display:block;border:0"></td>
            </tr>
          </table>

          <!-- Innhold: ikon til venstre, som i en dialogboks -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="32" valign="top" style="width:32px;padding:16px 0 0 14px"><img src="${o.appUrl}/mail/logo@2x.png" width="32" height="32" alt="Sølvposten" style="display:block;border:0"></td>
              <td valign="top" style="padding:14px 16px 6px 14px">
                <h1 style="margin:0 0 10px;font-family:${FONT};font-size:22px;line-height:26px;font-weight:700;color:#000000">Hei ${escapeHtml(o.firstName)}!</h1>
                ${o.bodyHtml}
                ${defaultButton(o.ctaUrl, o.ctaText)}
                ${o.footnote ? `<p style="margin:14px 0 0;padding:4px 6px;background:#ffffe1;border:1px solid #000000;${TEXT}">${o.footnote}</p>` : ''}
                <p style="margin:18px 0 10px;${TEXT}">Hilsen Sølvposten,<br>et initiativ for faglig stolthet</p>
              </td>
            </tr>
          </table>

          <!-- Statuslinje -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;margin-top:2px">
            <tr>${status}</tr>
          </table>

        </div>
      </td></tr>
    </table>

  </td></tr>
</table>
</body>
</html>`
}

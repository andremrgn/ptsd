import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SUPABASE_URL = 'https://jgdkjqvvcayrjtcapxrb.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZGtqcXZ2Y2F5cmp0Y2FweHJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNTU0MjEsImV4cCI6MjA5NjgzMTQyMX0.WYByow1BZpsicnCtoe9w50SDiUFR5iGJx3fwLp15fY8'
const RESEND_KEY = 're_cPwtqCUV_EYg9JR4KQ1FW25xqCSFCW97G'

const MESSAGES = [
  'Har\'u noen postetekster for en kompis eller?',
  'Nå erre vel noen postetekster som ligger og roper etter noe oppmerksomhet?',
  'Kan vel ikke bare være meg som er sulten på noe postetekster?',
]

const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
const resend = new Resend(RESEND_KEY)

const { data: teams } = await sb.from('teams').select('id, name')
if (!teams?.length) { console.log('Ingen team funnet'); process.exit(0) }

// Hent alle kreatører
const { data: kreatorer } = await sb
  .from('users')
  .select('email, full_name, team_id')
  .eq('role', 'kreatør')

if (!kreatorer?.length) { console.log('Ingen kreatører funnet'); process.exit(0) }

console.log(`Sender til ${kreatorer.length} kreatører...`)

// Gi hver person en ulik melding (syklisk, ingen får samme som forrige)
let lastIndex = -1
for (const person of kreatorer) {
  const available = MESSAGES.map((_, i) => i).filter(i => i !== lastIndex)
  const msgIndex = available[Math.floor(Math.random() * available.length)]
  lastIndex = msgIndex
  const message = MESSAGES[msgIndex]
  const firstName = person.full_name.split(' ')[0]

  const { error } = await resend.emails.send({
    from: 'Sølvposten <solvposten@mrgn.no>',
    to: person.email,
    subject: message,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:2rem;color:#2B2D42">
        <p style="font-size:1.4rem;font-weight:900;letter-spacing:-0.02em;margin-bottom:1.5rem">
          Hei ${firstName} 👋
        </p>
        <p style="font-size:1rem;line-height:1.6;margin-bottom:2rem">
          ${message}
        </p>
        <a href="https://solvposten.vercel.app/app/send-inn"
          style="display:inline-block;background:#ED555C;color:#ffffff;font-family:system-ui,sans-serif;font-size:0.85rem;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:0.85rem 1.75rem;border-radius:2px">
          Send inn postetekster →
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:2rem 0 1rem">
        <p style="font-size:0.8rem;color:#999">
          Hilsen Sølvposten, et initiativ for faglig stolthet
        </p>
      </div>
    `,
  })

  if (error) {
    console.log(`✗ ${person.email}: ${error.message}`)
  } else {
    console.log(`✓ ${firstName} (${person.email}) — melding ${msgIndex + 1}: "${message}"`)
  }
}

console.log('\nFerdig!')

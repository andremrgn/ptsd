# Sølvposten — prosjektinstruksjoner

Du jobber med **Sølvposten**, en intern konkurranse-app for Morgenstern der kreative team sender inn og bedømmer «postetekster» (innholdstekster til sosiale medier).

## Hva er Sølvposten?
En intern faglig konkurranse der kreatør-team sender inn postetekster for en gitt kunde/produksjon. Jury bedømmer bidragene. Leaderboard, feed og resultater vises for alle ansatte.

## Tech-stack
- **Én enkelt HTML-fil** (`index.html`) — all JS, CSS og logikk i én fil, ingen build-steg
- **Supabase** (PostgreSQL + Storage) — backend og fillagring
  - URL: `https://jgdkjqvvcayrjtcapxrb.supabase.co`
  - Storage bucket: `uploads` (team/profilbilder, screenshots)
- **GitHub**: `https://github.com/andremrgn/ptsd`
- **Vercel** — hosting (erstattet Netlify), auto-deploy ved push til `main`
- **Söhne-fonter** — lazy-loaded via `requestAnimationFrame` (base64 CSS injisert)
- `localStorage` nøkkel: `mg_user` for sesjonslagring

## Databaseskjema
```
users:       email, full_name, role, is_admin, team_id, nickname, favorite_quote, image_url
teams:       id, name, image_url, updated_at
submissions: id, team_id, submitted_by, kunde, produksjon, image_url, link, submitted_at
postetekster:id, submission_id, content, link, sort_order
kudos:       submission_id, from_email
scores:      submission_id, score
jury_codes:  id, jury_name, code, created_at
settings:    key, value  →  judging_active | results_visible | competition_title
```

## Rollesystem
```javascript
PARTICIPANT_ROLES = new Set(['kreatør','rådgiver','prosjektleder'])  // kan sende inn
OBSERVER_ROLES   = new Set(['designer','film','drift'])              // ser, kan gi kudos
```
- `is_admin: true` → tilgang til admin-panel (passord: `mrgn2026`)
- Jury logger inn med kode fra `jury_codes`-tabellen

## 5 kreatør-team (hardkodet UUID)
Teamene er definert i JS med faste UUIDs som matcher Supabase.

## Avatar-system
```javascript
AVATAR_COLORS = ['#ED555C','#2B2D42','#FFD97A','#88C896','#E8854A','#D4A050','#3D9E6A','#C85A4A','#0881D1','#6ED08C']
// Farge velges via nameHash(seed) % lengde
// SVG data-URL med encodeURIComponent (ikke btoa — unicode-safe)
// Initialer: kun bokstav-tegn (æøå støttes), maks 2
```

## Admin-panel (viktige funksjoner)
- `toggleJudging()` — slår juryering av/på (`judging_active` i settings)
- `toggleResults()` — viser/skjuler Resultater-fanen (`results_visible` i settings)
- Legg til/fjern jury-koder
- Se alle innsendte bidrag

## Resultater-fanen
Skjult som standard. Vises kun når `results_visible = 'true'` i settings-tabellen.
Admin kan toggle dette i kontrollpanelet.

## Viktige designvalg
- Morgenstern brand: Söhne-font, `#2B2D42` (mørk), `#ED555C` (rød), `#FFD97A` (gul)
- Ingen build-steg — alt i én fil, enkelt å deploye
- Kudos gis i feeden, ikke i tabellen (tabellen viser bare antall mottatt)
- Et bidrag (submission) kan ha flere postetekster, men telles som ett bidrag
- Submission-detaljside: viser postetekster + link til arbeidet

## Fremtidige oppgaver (ikke implementert ennå)
1. **Jury-innlogging og bedømmelsesflyt** — hvordan jury logger inn og gir poeng
2. **Månedlig e-postpåminnelse** via Resend — roterende avsender blant kreativt team
   - Tekster: «Har'u noen postetekster for en kompis eller?» / «Nå erre vel noen postetekster som ligger å roper etter noe oppmerksomhet» / «Kan vel ikke bare være meg som er sulten på noe postetekster?»
   - Signert: «Hilsen Sølvposten, et initiativ for faglig stolthet»

## Fil-referanse
Jobber alltid med `index.html` i `ptsd`-repoet. Etter endringer: commit + push til `main`, Vercel deployer automatisk.

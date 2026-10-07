<template>
  <div class="page-welcome">
    <!-- Win98-innloggingsdialog («Velkommen til Windows») -->
    <div class="window login-window">
      <div class="title-bar">
        <div class="title-bar-text"><span class="title-bar-caption">Velkommen til Sølvposten</span></div>
        <div class="title-bar-controls">
          <button aria-label="Help" title="Hjelp" @click="showHelp = !showHelp"></button>
        </div>
      </div>

      <template v-if="!magicLinkSent">
        <div class="login-body">
          <img src="/favicon.png" alt="" class="login-icon" />
          <div class="login-main">
            <p class="login-intro">
              {{ showMagicLink
                ? 'Skriv inn e-postadressen din, så sender vi deg en innloggingslenke.'
                : 'Skriv inn @mrgn.no-adressen og passordet ditt for å logge på Sølvposten.' }}
            </p>
            <div class="login-field">
              <label for="login-email">E-post:</label>
              <input id="login-email" v-model="email" type="email" placeholder="deg@mrgn.no" autocomplete="username" @keydown.enter="submit" />
            </div>
            <div v-if="!showMagicLink" class="login-field">
              <label for="login-pw">Passord:</label>
              <input id="login-pw" v-model="password" type="password" autocomplete="current-password" @keydown.enter="doLogin" />
            </div>
            <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
            <p v-if="showHelp" class="tooltip">
              Første gang du logger inn, eller har du glemt passordet? Trykk «Send meg en lenke» nederst, så får du en innloggingslenke på e-post.
            </p>
          </div>
          <div class="login-buttons">
            <button class="default" :disabled="loading" @click="submit">{{ loading ? 'Vent…' : 'OK' }}</button>
            <button :disabled="loading" @click="cancel">Avbryt</button>
          </div>
        </div>
        <div class="login-footer">
          <button class="btn-magic-link" @click="toggleMode">
            {{ showMagicLink ? 'Logg inn med passord i stedet' : 'Første gang eller glemt passord? Send meg en lenke' }}
          </button>
        </div>
      </template>

      <template v-else>
        <div class="login-body">
          <svg class="login-icon" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">
            <path d="M7 2h18v1h2v1h1v1h1v2h1v12h-1v2h-1v1h-1v1h-2v1H15l-7 6v-6H7v-1H5v-1H4v-1H3v-2H2V7h1V5h1V4h1V3h2z" fill="#fff" stroke="#000" />
            <rect x="15" y="6" width="3" height="3" fill="#00f" />
            <rect x="14" y="11" width="4" height="2" fill="#00f" />
            <rect x="15" y="11" width="3" height="9" fill="#00f" />
            <rect x="13" y="19" width="7" height="2" fill="#00f" />
          </svg>
          <div class="login-main">
            <p class="login-intro">Sjekk innboksen din. Vi har sendt en innloggingslenke til <strong>{{ email }}</strong>.</p>
            <p class="login-intro">Viktig: åpne lenken i <strong>samme nettleser</strong> du er i nå — ikke på en annen enhet (f.eks. mobilen).</p>
          </div>
          <div class="login-buttons">
            <button class="default" @click="magicLinkSent = false">OK</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showMagicLink = ref(false)
const magicLinkSent = ref(false)
const showHelp = ref(false)

const { login, sendMagicLink } = useAuth()
const router = useRouter()

function toggleMode() {
  showMagicLink.value = !showMagicLink.value
  errorMsg.value = ''
}

function submit() {
  if (showMagicLink.value) doMagicLink()
  else doLogin()
}

function cancel() {
  email.value = ''
  password.value = ''
  errorMsg.value = ''
  showMagicLink.value = false
}

async function doLogin() {
  errorMsg.value = ''
  if (!password.value) { errorMsg.value = 'Skriv inn passordet ditt.'; return }
  loading.value = true
  const err = await login(email.value.trim().toLowerCase(), password.value)
  loading.value = false
  if (err) {
    errorMsg.value = err
  } else {
    router.push('/app/hjem')
  }
}

async function doMagicLink() {
  errorMsg.value = ''
  loading.value = true
  const err = await sendMagicLink(email.value.trim().toLowerCase())
  loading.value = false
  if (err) {
    errorMsg.value = err
  } else {
    magicLinkSent.value = true
  }
}
</script>

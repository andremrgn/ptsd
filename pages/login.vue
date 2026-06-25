<template>
  <div class="page-welcome">
    <div class="welcome-card">
      <div class="welcome-logo">
        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="white">
          <circle cx="20" cy="20" r="18.5" fill="none" stroke="white" stroke-width="2.5"/>
          <text x="20" y="27.5" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="17" letter-spacing="-0.5">M</text>
        </svg>
        <span class="welcome-logo-text">Morgenstern</span>
      </div>
      <h1 class="welcome-title">Sølv<span class="coral">posten</span></h1>

      <template v-if="!magicLinkSent">
        <p class="welcome-subtitle">
          {{ showMagicLink ? 'Vi sender deg en innloggingslenke på e-post.' : 'Logg inn med din @mrgn.no-adresse.' }}
        </p>
        <div class="welcome-form">
          <label>E-post</label>
          <input
            v-model="email"
            type="email"
            placeholder="deg@mrgn.no"
            @keydown.enter="showMagicLink ? doMagicLink() : doLogin()"
          />
          <template v-if="!showMagicLink">
            <label style="margin-top:0.75rem">Passord</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              @keydown.enter="doLogin"
            />
          </template>
          <p v-if="errorMsg" class="welcome-error">{{ errorMsg }}</p>
          <button
            class="btn-welcome"
            :disabled="loading"
            @click="showMagicLink ? doMagicLink() : doLogin()"
          >
            {{ loading ? 'Laster…' : showMagicLink ? 'Send innloggingslenke →' : 'Logg inn →' }}
          </button>
          <button class="btn-magic-link" @click="toggleMode">
            {{ showMagicLink ? '← Logg inn med passord' : 'Første gang eller glemt passord? Send meg en lenke' }}
          </button>
        </div>
      </template>

      <template v-else>
        <p class="welcome-subtitle">
          Sjekk innboksen din. Vi har sendt en innloggingslenke til <strong>{{ email }}</strong>.
        </p>
        <button class="btn-magic-link" style="margin-top:1.5rem" @click="magicLinkSent = false">
          ← Prøv igjen
        </button>
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

const { login, sendMagicLink } = useAuth()
const router = useRouter()

function toggleMode() {
  showMagicLink.value = !showMagicLink.value
  errorMsg.value = ''
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

<style scoped>
.btn-magic-link {
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.btn-magic-link:hover {
  color: white;
}
</style>

<template>
  <div id="app-shell">
    <AppHeader />
    <TabBar />
    <main class="app-content">
      <slot />
    </main>
    <ProfileDrawer />
  </div>
</template>

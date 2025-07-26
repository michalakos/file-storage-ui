<template>
  <div class="page-container">
    <div class="card">
      <h1 class="title">Welcome</h1>
      <p class="subtitle">Please choose an option to continue</p>

      <div class="button-group">
        <router-link to="/login" class="btn btn-auth btn-primary"> Log In </router-link>

        <router-link to="/register" class="btn btn-auth btn-secondary"> Register </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  mounted() {
    // Vite environment variables test
    console.log('Vite Environment Variables:')
    console.log('- All env vars:', import.meta.env)
    console.log('- API URL:', import.meta.env.VITE_API_BASE_URL)
    console.log('- Debug mode:', import.meta.env.VITE_DEBUG)
    console.log('- Mode:', import.meta.env.MODE)
    console.log('- Dev mode:', import.meta.env.DEV)
  },
}
</script>

<style scoped>
.button-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .button-group {
    flex-direction: row;
    gap: 1.5rem;
  }

  .button-group .btn {
    flex: 1;
  }
}
</style>

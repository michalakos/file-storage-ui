<template>
  <div class="page-container">
    <div class="card">
      <h1 class="title">Log In</h1>
      <p class="subtitle">Welcome back! Please enter your credentials.</p>

      <form @submit.prevent="handleLogin" class="form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            v-model="form.username"
            placeholder="Enter your username"
            :disabled="loading"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="Enter your password"
            :disabled="loading"
            required
          />
        </div>

        <button type="submit" class="btn btn-auth btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>

      <div class="footer">
        <p>
          Don't have an account?
          <router-link to="/register" class="link">Register here</router-link>
        </p>
        <router-link to="/" class="link">← Back to home</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'

export default {
  name: 'LoginPage',
  data() {
    return {
      form: {
        username: '',
        password: '',
      },
      loading: false,
      errorMessage: '',
    }
  },
  mounted() {
    const authService = getAuthService()
    if (authService.isAuthenticated()) {
      console.log('User is logged in!')
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.errorMessage = ''

      try {
        const authRequest = {
          username: this.form.username,
          password: this.form.password,
        }

        const authService = getAuthService()
        const response = await authService.login(authRequest)

        console.log('Login successful:', response)
        this.$router.push('/dashboard')
      } catch (error) {
        console.error('Login failed:', error)
        this.errorMessage = error.message || 'Login failed. Please try again.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.error-message {
  background-color: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn:disabled:hover {
  transform: none;
  box-shadow: none;
}
</style>

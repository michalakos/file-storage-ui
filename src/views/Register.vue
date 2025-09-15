<template>
  <div class="page-container">
    <div class="card">
      <h1 class="title">Register</h1>
      <p class="subtitle">Create a new account to get started.</p>

      <form @submit.prevent="handleRegister" class="form">
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            v-model="form.username"
            placeholder="Choose a username"
            :disabled="loading"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            placeholder="Enter your email"
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
            placeholder="Create a password"
            :disabled="loading"
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary btn-full btn-auth card-auth form-control"
          :disabled="loading"
        >
          {{ loading ? 'Registering...' : 'Register' }}
        </button>
      </form>

      <div class="footer">
        <p>
          Already have an account?
          <router-link to="/login" class="link">Login here</router-link>
        </p>
        <router-link to="/" class="link">← Back to home</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'

export default {
  name: 'RegisterPage',
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: '',
      },
      loading: false,
      errorMessage: '',
    }
  },
  methods: {
    async handleRegister() {
      this.loading = true
      this.errorMessage = ''

      const authService = getAuthService() // Lazy get instance here

      console.warn(authService.getToken()) // Now safe to call

      try {
        const authRequest = {
          username: this.form.username,
          password: this.form.password,
          email: this.form.email,
        }

        const response = await authService.register(authRequest)

        console.log('Registration successful:', response)
        console.warn(authService.getToken())

        this.$router.push('/dashboard') // Redirect to dashboard or home
      } catch (error) {
        console.error('Registration failed:', error)
        this.errorMessage = error.message || 'Registration failed. Please try again.'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<template>
  <div>
    <AdminDashboard v-if="isAdmin" />
    <UserDashboard v-else />
  </div>
</template>

<script>
import { getAuthService } from '@/services/authService'
import UserDashboard from '@/components/UserDashboard.vue'
import AdminDashboard from '@/components/AdminDashboard.vue'

export default {
  name: 'DashboardRouter',
  components: {
    UserDashboard,
    AdminDashboard,
  },

  data() {
    return {
      isAdmin: false,
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    await this.checkUserRole()
  },

  methods: {
    async checkUserRole() {
      try {
        const authService = getAuthService()

        const token = authService.getToken()
        if (token) {
          const payload = this.decodeJWT(token)
          this.isAdmin = payload.role === 'admin' || payload.roles?.includes('admin')
        }
      } catch (error) {
        console.error('Failed to determine user role:', error)
        this.isAdmin = false
      }
    },

    decodeJWT(token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        )
        return JSON.parse(jsonPayload)
      } catch (error) {
        console.error('Failed to decode JWT:', error)
        return {}
      }
    },
  },
}
</script>

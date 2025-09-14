<template>
  <div>
    <AdminDashboard
      v-if="isAdmin && adminViewMode === 'admin'"
      @switchToUser="setAdminViewMode('user')"
    />
    <UserDashboard v-else @switchToAdmin="setAdminViewMode('admin')" />
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
      adminViewMode: 'admin',
    }
  },

  created() {
    // Handle direct navigation to specific dashboard views
    const currentRoute = this.$route.path
    if (currentRoute.includes('/admin')) {
      this.adminViewMode = 'admin'
      sessionStorage.setItem('adminViewMode', 'admin')
    } else if (currentRoute.includes('/user')) {
      this.adminViewMode = 'user'
      sessionStorage.setItem('adminViewMode', 'user')
    }
  },

  async mounted() {
    const authService = getAuthService()

    if (!authService.isAuthenticated()) {
      this.$router.push('/')
      return
    }

    await this.checkUserRole()

    // Check for stored admin view mode preference
    if (this.isAdmin) {
      const storedViewMode = sessionStorage.getItem('adminViewMode')
      if (storedViewMode && (storedViewMode === 'admin' || storedViewMode === 'user')) {
        this.adminViewMode = storedViewMode
      }
    }
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

    setAdminViewMode(mode) {
      this.adminViewMode = mode
      sessionStorage.setItem('adminViewMode', mode)
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

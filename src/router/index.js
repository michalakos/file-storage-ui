// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { getAuthService } from '@/services/authService'

// Import your components
import HomePage from '@/views/Home.vue'
import LoginPage from '@/views/Login.vue'
import RegisterPage from '@/views/Register.vue'
import DashboardRouter from '@/views/DashboardRouter.vue'
import FileUpload from '@/views/FileUpload.vue'
import FilesView from '@/views/FilesView.vue'
import SharedFilesView from '@/views/SharedFilesView.vue'

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardRouter,
    meta: { requiresAuth: true },
  },
  {
    path: '/upload',
    name: 'Upload',
    component: FileUpload,
    meta: { requiresAuth: true },
  },
  {
    path: '/files',
    name: 'Files',
    component: FilesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/shared',
    name: 'SharedFiles',
    component: SharedFilesView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  const authService = getAuthService()

  if (to.meta.requiresAuth && !authService.isAuthenticated()) {
    next('/')
  } else {
    next()
  }
})

export default router

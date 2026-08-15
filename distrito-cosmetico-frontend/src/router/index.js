import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const categoryRoutes = [
  {
    path: '/maquillaje',
    name: 'maquillaje',
    meta: {
      title: 'Maquillaje',
      heading: 'Maquillaje',
      description: 'Descubre productos para resaltar tu belleza.',
      filter: { type: 'categoria', value: 'Maquillaje' },
    },
  },
  {
    path: '/skincare',
    name: 'skincare',
    meta: {
      title: 'Skincare',
      heading: 'Skincare',
      description: 'Cuida tu piel con productos seleccionados para ti.',
      filter: { type: 'categoria', value: 'Skincare' },
    },
  },
  {
    path: '/cabello',
    name: 'cabello',
    meta: {
      title: 'Cabello',
      heading: 'Cabello',
      description: 'Dale vida y fuerza a tu cabello.',
      filter: { type: 'categoria', value: 'Cabello' },
    },
  },
  {
    path: '/fragancias',
    name: 'fragancias',
    meta: {
      title: 'Fragancias',
      heading: 'Fragancias',
      description: 'Encuentra el aroma perfecto para cada ocasión.',
      filter: { type: 'categoria', value: 'Fragancias' },
    },
  },
  {
    path: '/corporal',
    name: 'corporal',
    meta: {
      title: 'Corporal',
      heading: 'Cuidado Corporal',
      description: 'Consiente tu piel con nuestra selección corporal.',
      filter: { type: 'categoria', value: 'Corporal' },
    },
  },
  {
    path: '/promociones',
    name: 'promociones',
    meta: {
      title: 'Promociones',
      heading: 'Promociones',
      description: 'Aprovecha nuestras ofertas especiales.',
      filter: { type: 'promocion', value: true },
    },
  },
  {
    path: '/mas-vendidos',
    name: 'mas-vendidos',
    meta: {
      title: 'Más Vendidos',
      heading: 'Más Vendidos',
      description: 'Los favoritos de nuestros clientes.',
      filter: { type: 'seccion', value: 'mas_vendidos' },
    },
  },
  {
    path: '/nuevos-productos',
    name: 'nuevos-productos',
    meta: {
      title: 'Nuevos Productos',
      heading: 'Nuevos Productos',
      description: 'Descubre las últimas novedades.',
      filter: { type: 'seccion', value: 'nuevos_productos' },
    },
  },
].map((route) => ({
  ...route,
  component: () => import('../views/CatalogView.vue'),
  meta: { layout: 'store', ...route.meta },
}))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'inicio',
      component: () => import('../views/HomeView.vue'),
      meta: { layout: 'store', title: 'Distrito Cosmético' },
    },
    ...categoryRoutes,
    {
      path: '/categoria/:slug',
      name: 'categoria',
      component: () => import('../views/CatalogView.vue'),
      meta: { layout: 'store', title: 'Categoría' },
    },
    {
      path: '/carrito',
      name: 'carrito',
      component: () => import('../views/CartView.vue'),
      meta: { layout: 'store', title: 'Carrito' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { layout: 'auth', title: 'Acceso' },
    },
    {
      path: '/mi-cuenta',
      name: 'mi-cuenta',
      component: () => import('../views/AccountView.vue'),
      meta: { layout: 'store', title: 'Mi Cuenta', requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { layout: 'store', title: 'Panel de Administrador', requiresAdmin: true },
    },
    {
      path: '/nosotros',
      name: 'nosotros',
      component: () => import('../views/AboutView.vue'),
      meta: { layout: 'landing', title: 'Nosotros' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && !auth.isAdmin)
    return { name: auth.isAuthenticated ? 'inicio' : 'login' }
})

router.afterEach((to) => {
  document.title =
    to.name === 'inicio'
      ? 'Distrito Cosmético'
      : `${to.meta.title || 'Distrito Cosmético'} | Distrito Cosmético`
})

export default router

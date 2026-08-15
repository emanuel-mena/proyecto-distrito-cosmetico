<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import OrderCard from '../components/account/OrderCard.vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useCartStore } from '../stores/cart'

const auth = useAuthStore()
const orders = useOrdersStore()
const router = useRouter()
const cart = useCartStore()

onMounted(() => orders.loadForUser(auth.activeUser.id))

const logout = async () => {
  auth.logout()
  cart.useGuestCart()
  await router.push('/login')
}
</script>

<template>
  <main class="container py-5">
    <div class="card border-0 shadow-sm rounded-4 mb-4">
      <div class="card-body p-4">
        <div class="d-flex align-items-center">
          <div class="perfil-avatar me-4"><i class="bi bi-person-fill"></i></div>
          <div>
            <h3 class="fw-bold mb-1">
              Hola, <span>{{ auth.firstName }}</span> 👋
            </h3>
            <p class="text-muted mb-0">
              Aquí puedes consultar tu información y el estado de tus pedidos.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm rounded-4 h-100">
          <div class="card-body">
            <h5 class="fw-bold mb-4">
              <i class="bi bi-person-circle me-2"></i>Información Personal
            </h5>
            <p><strong>Nombre</strong><br />{{ auth.activeUser?.nombre }}</p>
            <p><strong>Correo</strong><br />{{ auth.activeUser?.correo }}</p>
            <hr />
            <button class="btn btn-outline-secondary w-100 mb-2" disabled>Editar Perfil</button>
            <button type="button" class="btn btn-danger w-100" @click="logout">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div class="card border-0 shadow-sm rounded-4">
          <div class="card-body">
            <h5 class="fw-bold mb-4"><i class="bi bi-box-seam me-2"></i>Mis Pedidos</h5>
            <div
              v-if="!orders.loading && orders.orders.length === 0"
              class="alert alert-light border rounded-4 text-center"
            >
              <h5 class="mb-2">Aún no has realizado compras</h5>
              <p class="text-muted mb-0">
                Cuando finalices una compra aparecerá aquí el historial de tus pedidos.
              </p>
            </div>
            <p v-if="orders.loading" class="text-center text-muted">Cargando pedidos...</p>
            <div v-else-if="orders.error" class="alert alert-danger">{{ orders.error }}</div>
            <OrderCard v-for="order in orders.orders" v-else :key="order.id" :order="order" />
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

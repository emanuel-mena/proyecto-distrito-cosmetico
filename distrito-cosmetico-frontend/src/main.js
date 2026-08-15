import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.min.css'
import './assets/styles/main.css'
import './assets/styles/landing.css'
import App from './App.vue'
import router from './router'
import { useCartStore } from './stores/cart'
import { useCatalogStore } from './stores/catalog'
import { useCategoriesStore } from './stores/categories'
import { useCurrencyStore } from './stores/currency'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

const catalog = useCatalogStore(pinia)
const categories = useCategoriesStore(pinia)
const currency = useCurrencyStore(pinia)
const cart = useCartStore(pinia)

Promise.all([catalog.load(), categories.load(), currency.setCurrency(currency.currency)]).then(() =>
  cart.load(),
)

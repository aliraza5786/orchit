import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import   './styles/theme.css'
import App from './App.vue'
import router from "./router";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query"
import { Toaster } from 'vue-sonner'
import '@/assets/fontawesome/css/fontawesome.min.css';
import '@/assets/fontawesome/css/regular.min.css';

const app = createApp(App)


app.component('Toaster', Toaster)
const queryClient = new QueryClient()
app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount("#app")

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import   './styles/theme.css'
import App from './App.vue'
import router from "./router";
import { VueQueryPlugin,  } from "@tanstack/vue-query"
import { Toaster } from 'vue-sonner'
import '@/assets/fontawesome/css/fontawesome.min.css';
import '@/assets/fontawesome/css/regular.min.css';
import { queryClient } from './libs/queryClient'

const app = createApp(App)


app.component('Toaster', Toaster)

app.use(createPinia())
.use(VueQueryPlugin, { queryClient })   // ← make sure this is here
app.use(router)

app.mount("#app")

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import   './styles/theme.css'
import App from './App.vue'
import router from "./router";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query"
import { Toaster } from 'vue-sonner'


const app = createApp(App)


app.component('Toaster', Toaster)
const queryClient = new QueryClient()
// This code is only for TypeScript
declare global {
    interface Window {
      __TANSTACK_QUERY_CLIENT__:
        import("@tanstack/query-core").QueryClient;
    }
  }
  
  // This code is for all users
  window.__TANSTACK_QUERY_CLIENT__ = queryClient;
app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount("#app")

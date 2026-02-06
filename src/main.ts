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
import { GanttPlugin } from '@syncfusion/ej2-vue-gantt';
import { registerLicense } from '@syncfusion/ej2-base';
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-vue-schedule/styles/material.css';
import { initThemeImmediately } from './composables/useTheme'
registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF1cXmhKYVtpR2NbeU52fldPal9TVAciSV9jS3hTdEVlWXladHFTQGRbWE91XQ==');
const app = createApp(App)
initThemeImmediately();
import vTooltip from './directives/vTooltip'
app.directive('tooltip', vTooltip)
app.component('Toaster', Toaster)
app.use(GanttPlugin)
app.use(createPinia())
.use(VueQueryPlugin, { queryClient })
app.use(router)
import vue3GoogleLogin from 'vue3-google-login'
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
})

app.mount("#app")

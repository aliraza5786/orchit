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

registerLicense('Ngo9BigBOggjHTQxAR8/V1JGaF5cXGpCfExwWmFZfVhgdl9HZ1ZSQGYuP1ZhSXxVdkRjXn9ccXNRR2FaVEN9XEA=');
const app = createApp(App)

import vTooltip from './directives/vTooltip'
app.directive('tooltip', vTooltip)



app.component('Toaster', Toaster)
app.use(GanttPlugin)
app.use(createPinia())
.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount("#app")

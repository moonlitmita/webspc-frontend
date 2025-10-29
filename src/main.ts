/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/el-loading.css';
import 'element-plus/theme-chalk/el-message-box.css';
import 'element-plus/theme-chalk/el-message.css';
import router from './router/router'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import 'element-plus/theme-chalk/index.css'
import './assets/less/index.less'
// import 'default-passive-events'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

import { useMainStore } from "./store";
import api from  './api/mainApi'
import { useChatStore } from './store/chat';
let restoreRoutes = async function() {
  const mainStore = useMainStore()
  const chatStore = useChatStore()
  const res = await api.refreshMenu({})
  mainStore.persistMenu(res.data.menu)
  mainStore.addRoutes(res.data.menu,router)
  chatStore.getSessionHistory()
} 
async function init() {
  try {
    await restoreRoutes()
  } catch (err) {
    router.replace({path: '/login'})
  }
}
async function start() {
  const app=createApp(App)
  app.use(pinia)
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  await init()
  app.use(router)
  app.mount('#app')
}
start()




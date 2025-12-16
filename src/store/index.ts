/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import type { RouteRecordRaw } from 'vue-router';
import  type { Tab } from "../api/mainApi";
import { useChatStore } from "./chat";

interface State {
  isCollapse: boolean,
  currentMenu:Tab|null,
  tabsList: Array<Tab>
  menu:Array<Tab>,
  routes:Array<RouteRecordRaw>,
  token: string,
  currentTab: number,
  aiVisible: boolean,
  isRealTimeMode: boolean
}
export const useMainStore = defineStore('main', {
  state: ():State => {
    return {
      isCollapse: false,
      currentMenu: {
        path: "",
        name: "",
        label: "",
        icon: "",
        url: ""
      },
      tabsList: [{
        path: '/',
        name: 'home',
        label: '首页',
        icon: 'home',
      }],
      menu: [],
      routes: [],
      token: '',
      currentTab: 0,
      aiVisible: false,
      isRealTimeMode: false
    }
  },
  getters: {},
  actions: {
    updateIsCollapse() {
      this.isCollapse = !this.isCollapse
    },
    toggleAi() {
      this.aiVisible = !this.aiVisible
      const chatStore = useChatStore()
      if(!this.aiVisible) {
        chatStore.endSession()
      }
    },
    selectMenu(val:Tab) {
      if(val.name=='home') {
        this.currentMenu = null
      } else {
        this.currentMenu = val
        let result = this.tabsList.findIndex(item=> item.name===val.name)
        result==-1? this.tabsList.push(val): ''
      }
    },
    persistMenu(val:Array<Tab>) {
      this.menu = val
    },
    addRoutes(data: Array<Tab>, router: any) {
      const modules: any = import.meta.glob('../views/**/*.vue')
      const dynamicRoutes = (data:Array<Tab>): RouteRecordRaw[]=>{
        let newRoutes: RouteRecordRaw[] = data.map((r)=> {
          let routes: RouteRecordRaw = {
            path: r.path,
            name: r.name,
            label: r.label,
            icon: r.icon,
            url: r.url,
            // meta: r.meta,
            component:modules[`../views/${r.url}.vue`],
            children: r.children ? dynamicRoutes(r.children) : undefined
          } as RouteRecordRaw
          return routes
        })
        return newRoutes
      }
      let res: RouteRecordRaw[] = dynamicRoutes(data)
      this.routes = []
      this.routes.push(...res)
      this.routes.forEach(item=> {
        router.addRoute('main', {
          path: item.path,
          name: item.name,
          children: item.children,
          component: item.component
        })
      })
    },
    setToken(val:string) {
      this.token = val
      localStorage.setItem('token',JSON.stringify(val))
    },
    clearMenu() {
      this.menu = []
      this.routes = []
      this.tabsList = [{
        path: '/',
        name: 'home',
        label: '首页',
        icon: 'home',
    }]
    },
    clearToken() {
      this.token=''
      localStorage.removeItem('token')
    },
    toggleRealTimeMode() {
      this.isRealTimeMode = !this.isRealTimeMode
    }
  },
  persist: true
})

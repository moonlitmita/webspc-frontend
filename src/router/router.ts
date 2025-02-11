/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { createRouter, createWebHashHistory } from "vue-router"
import type { RouteRecordRaw } from 'vue-router';

const routes:Array<RouteRecordRaw> = [
  {
    path:'/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path:'/',
    name: 'main',
    component: () => import('../views/Main.vue'),
    meta: { requiresAuth: true },
    redirect: '/home',
    children: []
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundComponent.vue'),
    children: []
  }
]
const router = createRouter({
  // history: createWebHistory(),
  history: createWebHashHistory(),
  routes
})
router.beforeEach((to, from, next)=>{
  const foundRoute = router.getRoutes().find(route => route.path === to.path)
    if (!foundRoute) {
      next({name: 'NotFound', query: {redirect: to.fullPath}})
    } else {
      const needAuth = to.matched.some(r=>r.meta?.requiresAuth)
      if(needAuth) {
        const isLogin = localStorage.getItem('token')?true:false
        if(!isLogin) {
          next({name: 'login', query: {redirect: to.fullPath}})
        } else {
          next()
        }
      } else {
        next()
      }
    }
})
export default router
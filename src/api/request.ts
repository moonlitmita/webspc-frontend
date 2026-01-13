/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import type { AxiosInstance, AxiosHeaders } from 'axios'
import axios from 'axios'
import config from '../config'
import { ElMessage } from 'element-plus'
// import {useRouter, useRoute} from 'vue-router'
import router from '../router/router'

// const router = useRouter()
// const route = useRoute()

const NETWORK_ERROR = '网络异常，请稍后再试'

interface MyHeaders extends AxiosHeaders {
  Authorization?: string
}

interface Options<T = any> {
  url: string
  method: string
  mock: boolean
  data?: any
  params?: any
  responseType?: 'stream' | 'json' | 'arraybuffer' | 'blob' 
}

/* ========== 工厂：创建带统一拦截器的实例 ========== */
function createService(baseURL: string): AxiosInstance {
  const ins = axios.create({ baseURL })

  ins.interceptors.request.use(
    (config)=> {
      const token = localStorage.getItem('token')
      if(token) {
        (config.headers as MyHeaders).Authorization = `Bearer ${token}`
      } 
      return config
    },
    (error) => Promise.reject(error)
  )

  ins.interceptors.response.use(
    (res)=> {
      const code = res.data.code || 200
      const data = res.data
      const msg = res.data.data.message
      if(code === 200) {
        return data
      } 
      else if (code === 401) {
        localStorage.removeItem('token')
        const { path, fullPath } = router.currentRoute.value
        if (path === '/login') return Promise.resolve(null)
        router.replace({ name: "login", query: {redirect: fullPath}})
        return Promise.resolve(null)
      } else {
        ElMessage.error(msg || NETWORK_ERROR)
        return Promise.reject(msg || NETWORK_ERROR)
      }    
    },
    (error)=> {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        const { path, fullPath } = router.currentRoute.value
        if (path === '/login') return Promise.resolve(null)
        router.replace({ name: "login", query: {redirect: fullPath}})
        return Promise.resolve(null)
      }
      let { message } = error
      if (message == "Network Error") {
        message = "后端接口连接异常"
      } else if (message.includes("timeout")) {
        message = "系统接口请求超时"
      } else if (message.includes("Request failed with status code")) {
        message = "系统接口" + message.substr(message.length - 3) + "异常"
      }
      ElMessage.error(message)
      return Promise.reject(error)
    }
  )
  return ins
} 

/* ========== 业务后端实例 ========== */
export const service = createService(config.baseApi)

/* ========== AI后端实例 ========== */
export const aiService = createService(config.chatApi)

export function request<T = any>(options: Options<T>): Promise<T> {
  options.method = options.method || 'get'
  if (options.method.toLowerCase()=='get') {
    options.params = options.data
  }
  let isMock = config.mock 
  if (typeof options.mock !== 'undefined') {
    isMock = options.mock
  }
  if (config.env=='production') {
    service.defaults.baseURL = config.baseApi
  } else {
    service.defaults.baseURL = isMock ? config.mockApi : config.baseApi
  }
  return service(options) as Promise<T>
}

/* ========== 新增：MCP请求函数 ========== */
export function MCPRequest<T = any>(options: Options<T>): Promise<T> {
  options.method = options.method || 'post'
  if (options.method.toLowerCase()=='get') {
    options.params = options.data
  }
  let isMock = config.mock 
  if (typeof options.mock !== 'undefined') {
    isMock = options.mock
  }
  if (config.env=='production') {
    service.defaults.baseURL = config.baseApi
  } else {
    service.defaults.baseURL = isMock ? config.mockApi : config.baseApi
  }
  return aiService(options) as Promise<T>
}

/* ========== 新增：chat请求函数 ========== */
export function chatRequest<T = any>(options: Options<T>): Promise<T> {
  options.method = options.method || 'post'
  if (options.method.toLowerCase()=='get') {
    options.params = options.data
  }
  let isMock = config.mock 
  if (typeof options.mock !== 'undefined') {
    isMock = options.mock
  }
  if (config.env=='production') {
    service.defaults.baseURL = config.baseApi
  } else {
    service.defaults.baseURL = isMock ? config.mockApi : config.baseApi
  }
  return aiService(options) as Promise<T>
}

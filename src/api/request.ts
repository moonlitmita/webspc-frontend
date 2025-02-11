/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import axios, { AxiosHeaders } from 'axios'
import config from '../config'
import { ElMessage } from 'element-plus'

const NETWORK_ERROR = '网络异常，请稍后再试'

interface MyHeaders extends AxiosHeaders {
  Authorization?: string
}

interface Options {
  url: string
  method: string
  mock: boolean
  data: any
  params?: any
}

const service = axios.create({
  baseURL: config.baseApi
})

service.interceptors.request.use((config)=> {
  const token = localStorage.getItem('token')
  if(token) {
    (config.headers as MyHeaders).Authorization = `Bearer ${token}`
  } 
  return config
},
(error) => Promise.reject(error)
)

service.interceptors.response.use((res)=> {
  const code = res.data.code || 200
  const data = res.data.data
  const msg = res.data.data.message
  if(code === 200) {
    return data
  } 
  else if (code === 401) {
    ElMessage.error(msg || NETWORK_ERROR)
  } else {
    ElMessage.error(msg || NETWORK_ERROR)
    return Promise.reject(msg || NETWORK_ERROR)
  }
    
},
(error)=> {
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
}) 

function request(options: Options) {
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
  return service(options)
}
export default request

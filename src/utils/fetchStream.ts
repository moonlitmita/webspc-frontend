/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { ElMessage } from 'element-plus'
import config from '@/config'
import router from '../router/router'

const NETWORK_ERROR = '网络异常，请稍后再试'

/* 统一错误提示 */
function handleError(text: string) {
  ElMessage.error(text || NETWORK_ERROR)
}

interface StreamOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  headers?: Record<string, string>
}

/**
 * 原生 fetch 封装，仅用于流式接口
 * 返回原生的 Response，调用方自己读 body
 */
export async function fetchStream(options: StreamOptions): Promise<Response | null> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  const res = await fetch(`${config.chatApi}${options.url}`, {
    method: options.method ?? 'POST',
    headers,
    body: options.data ? JSON.stringify(options.data) : undefined
  })
  
  /* 401 统一处理 */
  if (res.status === 401) {
    localStorage.removeItem('token')
    router.replace('/login')
    return null /* 让调用链结束 */
  }

  /* 统一 HTTP 异常处理 */
  if (!res.ok) {
    // handleError(`${res.status} ${res.statusText}`)
    // return Promise.reject(res.statusText)
    let message = `${res.status} ${res.statusText}`
  
    try {
      // 尝试解析后端返回的 JSON 错误详情
      const errorJson = await res.json()
      message = errorJson.detail || errorJson.message || message
    } catch {
      // 解析失败，使用默认状态文本
    }
    
    handleError(message)
    return Promise.reject(message)
  }

  /* 直接返回原生 Response，让外部 getReader() */
  return res
}
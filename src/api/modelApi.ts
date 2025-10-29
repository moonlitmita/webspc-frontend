/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { chatRequest } from './request'

export interface ModelConfig {
  id: string
  name: string
  description?: string
  base_url?: string
  api_key_env?: string
  provider?: string
  [key: string]: any // 允许其他自定义配置项
}

export interface ProviderItem {
  key: string
  label: string 
}

export interface ProvidersResponse {
  code: number
  data: ProviderItem[]
}

export interface ModelsByProviderResponse {
  code: number
  data: ModelConfig[]
}

export interface CurrentModelResponse {
  code: number
  data: {
    current_model: ModelConfig
    message: string
  }
}

export interface SwitchModelResponse {
  code: number
  data: {
    message: string
    success: boolean
  }
}

export interface ModelConfigsResponse {
  code: number
  data: {
    model_configs: Record<string, any>
    message: string
  }
}

export const modelApi = {
  getProviders() {
    return chatRequest<ProvidersResponse>({
      url: '/models/providers',
      method: 'get',
      mock: false
    })
  },
  getModelsByProvider(provider: string) {
    return chatRequest<ModelsByProviderResponse>({
      url: '/models/available',
      method: 'get',
      mock: false,
      params: { provider }
    })
  },
  /**
   * 获取当前使用的模型
   */
  getCurrentModel() {
    return chatRequest<CurrentModelResponse>({
      url: '/models/current',
      method: 'get',
      mock: false
    })
  },
  /**
   * 切换当前使用的模型
   */
  switchModel(provider: string, model_id: string) {
    return chatRequest<SwitchModelResponse>({
      url: '/models/switch',
      method: 'post',
      mock: false,
      data: { provider, model_id }
    })
  },
  /**
   * 获取全部模型配置
   */
  getModelConfigs() {
    return chatRequest<ModelConfigsResponse>({
      url: '/models/config',
      method: 'get',
      mock: false
    })
  },
  /**
   * 更新模型配置
   */
  updateModelConfigs(configs: Record<string, any>) {
    return chatRequest<ModelConfigsResponse>({
      url: '/models/config',
      method: 'post',
      mock: false,
      data: { configs }
    })
  }
}
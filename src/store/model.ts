/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from 'pinia'
import { modelApi } from '@/api/modelApi'
import type { ModelConfig } from '@/api/modelApi'
import { ElMessage } from 'element-plus';

interface ModelState {
  providers: {key: string; label: string}[]
  currentProvider: string | null
  modelsByProvider: ModelConfig[]
  currentModel: ModelConfig | null
  loading: boolean
  configs: Record<string, any>
}

export const useModelStore = defineStore('model', {
  state: (): ModelState => ({
    providers: [],
    currentProvider: null,
    modelsByProvider: [],
    currentModel: null,
    loading: false,
    configs: {}
  }),

  getters: {
    getCurrentModelKey: (state) => {
      return state.currentModel?.model_key || ''
    },
    getCurrentModelName: (state) => {
      return state.currentModel?.model_name || ''
    },
    isModelLoaded: (state) => {
      return state.currentModel !== null
    }
  },

  actions: {
    async fetchProviders() {
      try {
        const res = await modelApi.getProviders()
        this.providers = res.data
      } catch (error) {
        ElMessage.error('get API provider failed')
      }
    },
            
    async fetchModelsbyProvider(provider: string) {
      const res = await modelApi.getModelsByProvider(provider)
      this.modelsByProvider = res.data
    },

    // 获取当前使用的模型
    async fetchCurrentModel() {
      this.loading = true
      try {
        const response = await modelApi.getCurrentModel()
        if (response.code === 200) {
          this.currentModel = response.data.current_model
          this.currentProvider = this.currentModel.provider || null
        }
      } catch (error) {
        ElMessage.error('当前模型获取失败')
      } finally {
        this.loading = false
      }
    },

    // 切换模型
    async switchModel(provider: string , model_id: string) {
        this.loading = true
        try {
          const response = await modelApi.switchModel(provider, model_id)
          if (response.code === 200 && response.data.success) {
            //将准备发送给后端的provider赋值给当前的provider
            this.currentProvider = provider || null
            // 切换成功后重新获取当前模型以更新状态
            await this.fetchCurrentModel()
            return { success: true, message: response.data.message }
          } else {
            return { success: false, message: response.data.message || '切换模型失败' }
          }
        } catch (error) {
          ElMessage.error('切换模型失败')
          return { success: false, message: '切换模型时发生错误' }
        } finally {
          this.loading = false
        }
    },
  // 模型配置相关方法
    async fetchModelConfigs() {
      this.loading = true
      try {
        const response = await modelApi.getModelConfigs()
        if (response.code === 200) {
          this.configs = response.data.model_configs
        }
      } catch (error) {
        ElMessage.error('模型配置获取失败')
      } finally {
        this.loading = false
      }
    },
    async updateModelConfigs() {
      this.loading = true
      try {
        const response = await modelApi.updateModelConfigs(this.configs)
        if (response.code === 200) {
          return { success: true, message: response.data.message }
        } else {
          return { success: false, message: response.data?.message || "更新失败"}
        }
      } catch (error) {
        ElMessage.error('模型配置更新失败')
        return { success: false, message: '更新模型配置失败' }
      } finally {
        this.loading = false
      }
    },
    persist: true
  }
})
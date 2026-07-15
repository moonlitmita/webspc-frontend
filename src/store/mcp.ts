/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import { mcpApi } from '@/api/mcpApi'
import type { MCPConfig } from '../api/mcpApi'
import { ElMessage } from "element-plus";

export const useMCPStore = defineStore('mcp', {
  state: (): MCPConfig => {
    return {
      mcpServers: {}
    }
  },
  getters: {},
  actions: {
    async loadConfig() {
      try {
        let res = await mcpApi.getMCP({})
        if (!res) return  //该行代码用于阻拦token过期后跳转登录页面错误冒泡
        this.mcpServers = res.data.mcp_config.mcpServers ?? {}
      } catch (error) {
        ElMessage.error('解析失败')
      } finally {
        //
      }
    },
    async updateConfig() {
      try {
        const res = await mcpApi.updateMCP(this.mcpServers)
        if (res.code === '200') {
          return { success: true, message: res.data.message}
        } else {
          // 可选：立即重拉一遍配置，确保与磁盘一致
          await this.loadConfig()
          return { success: false, message: res.data?.message || '更新失败' }
        }
      } catch (e: any) {
        ElMessage.error('更新失败：' + (e.message || e))
        return { success: false, message: e.message || '更新失败' }
      }
    }
  },
  persist: true
})

/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from 'pinia'
import { alarmApi } from '../api/alarmApi'
import { ElMessage } from 'element-plus'
import type { AlarmData } from '../api/alarmApi'

interface AlarmState {
  isAnalyzing: boolean
  lastAnalysisResult: any | null
  analysisError: string | null
}

export const useAlarmStore = defineStore('alarm', {
  state: (): AlarmState => ({
    isAnalyzing: false,
    lastAnalysisResult: null,
    analysisError: null
  }),
  actions: {
    async analyzeAlarm(alarmData: AlarmData) {
      this.isAnalyzing = true
      this.analysisError = null

      try {
        const response = await alarmApi.analyzeAlarm(alarmData)

        // Handle response based on the expected structure from chatRequest wrapper
        if (response && response.code === 200 && response.data && response.data.success) {
          this.lastAnalysisResult = response.data
          ElMessage.success(response.data.message || '告警分析任务已启动')
          return response.data
        } else if (response && response.code === 200) {
          // Fallback to the original expected structure
          this.lastAnalysisResult = response.data
          ElMessage.success('告警分析任务已启动')
          return response.data
        } else {
          // Handle error case
          const errorMessage = response?.data?.message || '未知错误'
          this.analysisError = errorMessage
          ElMessage.error(`告警分析任务启动失败: ${errorMessage}`)
          throw new Error(errorMessage)
        }
      } catch (error: any) {
        this.analysisError = error.message || '请求失败'
        ElMessage.error(`触发告警时发生错误: ${error.message || '未知错误'}`)
        throw error
      } finally {
        this.isAnalyzing = false
      }
    }
  },
  persist: true
})
/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { chatRequest } from './request'
import type { Outlier } from '../store/lineData'

export interface AlarmData {
  title: string
  content: string
  outliers: Outlier[]
  project: string
  process: string
  product: string
  spcType: string[]
  additional_info?: Record<string, any>
}

// Backend response structure
export interface BackendAlarmResponse {
  success: boolean
  message: string
}

export interface AlarmResponse {
  code: number
  data: BackendAlarmResponse
}

export const alarmApi = {
  /**
   * 手动触发告警分析
   */
  analyzeAlarm(alarmData: AlarmData) {
    return chatRequest<AlarmResponse>({
      url: '/alarm/analyze',
      method: 'post',
      mock: false,
      data: alarmData
    })
  }
}
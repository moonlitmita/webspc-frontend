/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { request } from './request'

export interface PeriodicTask {
  id: number
  name: string
  project_id: string
  task: string
  enabled: boolean
  schedule_type: 'interval' | 'crontab'
  schedule_value: string
  args: string | null
  kwargs: string | null
  add_date: string | null
  upd_date: string | null
}

export interface TaskResponse {
  code: number
  data: {
    task_list?: PeriodicTask[]
    tasks_list?: PeriodicTask[]
    new_task?: PeriodicTask
    update_task?: PeriodicTask
    toggle_task?: PeriodicTask
    total?: number
    message: string
  }
}

export interface TaskAddParams {
  name: string
  task: string
  enabled?: boolean
  schedule_type: 'interval' | 'crontab'
  schedule_value: any
  args?: any[]
  kwargs?: Record<string, any>
}

export interface TaskUpdateParams {
  name?: string
  task?: string
  enabled?: boolean
  schedule_type?: 'interval' | 'crontab'
  schedule_value?: any
  args?: any[]
  kwargs?: Record<string, any>
}

export default {
  getTasks(params: any) {
    return request<TaskResponse>({
      url: '/tasks',
      method: 'get',
      mock: false,
      data: params
    })
  },
  addTask(params: TaskAddParams) {
    return request<TaskResponse>({
      url: '/tasks',
      method: 'post',
      mock: false,
      data: params
    })
  },
  updateTask(taskId: number, params: TaskUpdateParams) {
    return request<TaskResponse>({
      url: `/tasks/${taskId}`,
      method: 'put',
      mock: false,
      data: params
    })
  },
  deleteTask(taskId: number) {
    return request<TaskResponse>({
      url: `/tasks/${taskId}`,
      method: 'delete',
      mock: false
    })
  },
  toggleTask(taskId: number) {
    return request<TaskResponse>({
      url: `/tasks/${taskId}/toggle`,
      method: 'put',
      mock: false
    })
  },
  refreshSchedules() {
    return request<TaskResponse>({
      url: '/tasks/refresh',
      method: 'post',
      mock: false
    })
  }
}
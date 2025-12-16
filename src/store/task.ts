/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/taskApi'
import type { TaskResponse, PeriodicTask} from '../api/taskApi'

interface TaskConfig {
  taskList: PeriodicTask[]
  config: {
    total: number | null
    page: number
    pageSize: number
    searchInfo: string
  }
}

interface TaskActions {
  getTasks(): Promise<void>
  addTask(val: any): Promise<any>
  updateTask(taskId: number, val: any): Promise<any>
  deleteTask(taskId: number): Promise<any>
  toggleTask(taskId: number): Promise<any>
  refreshSchedules(): Promise<any>
}

export const useTaskStore = defineStore<'task', TaskConfig, {}, TaskActions>('task', {
  state: (): TaskConfig => {
    return {
      taskList: [],
      config: {
        total: 0,
        page: 1,
        pageSize: 10,
        searchInfo: ""
      }
    }
  },
  getters: {},
  actions: {
    async getTasks(): Promise<void> {
      // 修正参数：后端期望的是 page, pageSize, searchInfo 参数
      const params = {
        page: this.config.page,
        pageSize: this.config.pageSize,
        searchInfo: this.config.searchInfo
      }
      const res: TaskResponse = await api.getTasks(params)
      // 优先使用新的 task_list 字段，如果不存在则回退到 tasks_list
      this.taskList = res.data.task_list || res.data.tasks_list || []
      this.config.total = res.data.total || this.taskList.length
    },
    async addTask(val: any) {
      const res = await api.addTask(val)
      return res
    },
    async updateTask(taskId: number, val: any) {
      const res = await api.updateTask(taskId, val)
      return res
    },
    async deleteTask(taskId: number) {
      const res = await api.deleteTask(taskId)
      return res
    },
    async toggleTask(taskId: number) {
      const res = await api.toggleTask(taskId)
      // Update the local task list with the toggled status
      const taskIndex = this.taskList.findIndex(task => task.id === taskId)
      if (taskIndex !== -1) {
        this.taskList[taskIndex].enabled = res.data.toggle_task?.enabled || !this.taskList[taskIndex].enabled
      }
      return res
    },
    async refreshSchedules() {
      const res = await api.refreshSchedules()
      return res
    }
  },
  persist: true
})

/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/mainApi'
import type { ProjectResponse } from '../api/mainApi'


interface ProjectConfig {
  projectList: ProjectResponse['data']['list']
  all: ProjectResponse['data']['all']
  config: {
    total: number | null
    page: number
    pageSize: number
    searchInfo: string
  }
}
export const useProjectStore = defineStore('project', {
  state: (): ProjectConfig => {
    return {
      projectList: [],
      all: [],
      config: {
        total: 0,
        page:1,
        pageSize: 5,
        searchInfo: ''
      }
    }
  },
  getters: {},
  actions: {
    async getProjectData(): Promise<void> { 
      let res: ProjectResponse = await api.getProjectData(this.config)
      this.config.total = res.data.total ?? null
      this.projectList= res.data.list || []
      this.all = res.data.all || []
    },
    async addProject(val: any) {
      await api.addProject(val)
    },
    async editProject(val: any) {
      await api.editProject(val)
    },
    async deleteProject(val: any) {
      await api.deleteProject(val)
    }
  },
  persist: true
})
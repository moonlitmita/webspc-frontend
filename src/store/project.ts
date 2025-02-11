/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/api'
import type {Project, ProjectResponse} from '../api/api'
import type { AxiosResponse } from "axios";

interface ProjectConfig {
  projectList: Array<Project>
  all: Array<Project>
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
    let res: AxiosResponse<ProjectResponse> = await api.getProjectData(this.config)
    this.config.total = res.total
    this.projectList= res.list
    this.all = res.all
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
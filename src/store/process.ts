/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/api'
import type {Process,ProcessResponse} from '../api/api'
import type { AxiosResponse } from "axios";

interface ProcessConfig {
  processList_pagination: Array<Process>
  processList_all: Array<Process>
  config: {
    total: number | null
    page: number
    pageSize: number
    searchInfo: string
  }
}
export const useProcessStore = defineStore('process', {
  state: (): ProcessConfig => {
    return {
      processList_pagination: [],
      processList_all: [],
      config: {
        total: 0,
        page:1,
        pageSize: 5,
        searchInfo:''
      }
    }
  },
  getters: {},
  actions: {
    async getProcessData(getAll: Boolean):Promise<void> { 
      let res: AxiosResponse<ProcessResponse> = await api.getProcessData({...this.config, getAll: getAll})
      if(getAll) {
        this.processList_all = res.all
      } else {
        this.config.total = res.total
        this.processList_pagination= res.list
      }
    },
    async addProcess(val: any) {
      await api.addProcess(val)
    },
    async editProcess(val: any) {
      await api.editProcess(val)
    },
    async deleteProcess(val: any) {
      await api.deleteProcess(val)
    }
  },
  persist: true
})
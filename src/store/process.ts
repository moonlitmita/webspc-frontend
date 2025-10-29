/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/mainApi'
import type { ProcessResponse } from '../api/mainApi'


interface ProcessConfig {
  processList_pagination: ProcessResponse['data']['list']
  processList_all: ProcessResponse['data']['all']
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
      let res: ProcessResponse = await api.getProcessData({...this.config, getAll: getAll})
      if(getAll) {
        this.processList_all = res.data.all || []
      } else {
        this.config.total = res.data.total ?? null
        this.processList_pagination= res.data.list || []
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
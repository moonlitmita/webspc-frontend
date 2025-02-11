/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/api'
import type { Dep, DepResponse } from '../api/api'
import type { AxiosResponse } from 'axios'

interface DepConfig {
  depList_pagination: Array<Dep>
  depList_all: Array<Dep>
  config: {
    total: number | null
    page: number
    pageSize: number
    dep: string
  }
}
export const useDepStore = defineStore('dep', {
  state: ():DepConfig => {
    return {
      depList_pagination: [],
      depList_all: [],
      config: {
        total: 0,
        page:1,
        pageSize: 5,
        dep:''
      }   
    }
  },
  getters: {},
  actions: {
    async getDepData(getAll: Boolean): Promise<void> { 
      let res: AxiosResponse<DepResponse> = await api.getDepData({...this.config, getAll:getAll})
      if(getAll) {
        this.depList_all = res.all
      } else {
        this.config.total = res.total
        this.depList_pagination= res.list
      }
    },
    async addDep(val: any) {
      await api.addDep(val)
    },
    async editDep(val: any) {
      await api.editDep(val)
    },
    async deleteDep(val: any) {
      await api.deleteDep(val)
    }
  },
  persist: true
})
/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/mainApi'
import type { DepResponse } from '../api/mainApi'

interface DepState {
  depList_pagination: DepResponse['data']['list'] 
  depList_all:DepResponse['data']['all']                                  
  config: {
    total: number | null
    page: number
    pageSize: number
    dep: string
  }
}
export const useDepStore = defineStore('dep', {
  state: ():DepState => {
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
      let res: DepResponse = await api.getDepData({...this.config, getAll:getAll})
      if(getAll) {
        this.depList_all = res.data.all || []
      } else {
        this.config.total = res.data.total ?? null
        this.depList_pagination= res.data.list || []
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

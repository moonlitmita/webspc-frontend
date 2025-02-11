/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia";
import api from '../api/api'
import type { User, UserResponse } from '../api/api'
import type { AxiosResponse } from 'axios'

interface UserConfig {
  userList: Array<User>
  config: {
  total: number | null
  page: number
  pageSize: number
  searchInfo: string
  }
}
export const useUserStore = defineStore('user', {
  state: (): UserConfig => {
    return {
      userList: [],
      config: {
        total: 10,
        page:1,
        pageSize: 5,
        searchInfo: ""
      }
    }
  },
  getters: {},
  actions: {
    async getUserData(): Promise<void> { 
      let res: AxiosResponse<UserResponse> = await api.getUserData(this.config)
      this.userList = res.list.map((item: User)=>{
        item.gender = item.gender === "0" ? '女' : '男'
        item.is_super_user = item.is_super_user === "True" ? "是" : "否"
        item.is_staff = item.is_staff === "True" ? "是" : "否"
        item.is_active = item.is_active === "True" ? "是" : "否"
        return item
      })
    this.config.total = res.total
    },
    async addUser(val: any) {
      await api.addUser(val)
    },
    async editUser(val: any) {
      await api.editUser(val)
    },
    async deleteUser(val: any) {
      await api.deleteUser(val)
    }
  },
  persist: true
})
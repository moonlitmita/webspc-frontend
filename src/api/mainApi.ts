/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { request } from './request'
import type { AxiosResponse } from 'axios';

export interface Tab {
  path:string,
  name: string|undefined,
  label: string,
  icon: string,
  url?: string,
  children?: Tab[],
  component?: any
}

export interface Data {
  id: string
  project_id: string
  samples: number[]
  add_date: string
}

export interface User {
  id: string
  realname: string
  gender: number | string
  username: string
  dep: string
  is_super_user: string
  is_staff: string
  is_active: string
  add_date: string
  upd_date: string
}

export interface Dep {
  id : string
  dep: string
}

export interface Process {
  id : string
  dep: string
  process: string
}

export interface Project {
  id : string
  dep: string
  process: string
  product: string
  project: string
  spcType1: string
  spcType2: string
  spcType3: string
  sampleSize: number
  USL: number
  LSL: number
  selectedChecks: Array<string>
  dataCollectionType: string
}

export interface MenuResponse {
  menu: Array<Tab>
  token: string
  message: string
}

export interface DataResponse {
  code: string
  data: {
    list?: Array<Data> | null
    all?: Array<Data> | null
    total?: number | null
    message: string
    test_name: string
    p_value: string
    variance_between: string | null
    variance_within: string | null
  }
}

export interface UserResponse {
  code: string
  data: {
    total: number | null
    list: Array<User>
    message: string
  }
}

export interface DepResponse {
  code: string
  data: {
    total?: number | null
    list?: Array<Dep>
    all?: Array<Dep>
    message: string
  }
}

export interface ProcessResponse {
  code: string
  data: {
    total?: number | null
    list?: Array<Process>
    all?: Array<Process>
    message: string
  }
}

export interface ProjectResponse {
  code: string
  data: {
    total?: number | null
    list?: Array<Project>
    all?: Array<Project>
    message: string
  }
}

export default {
  getHomeData(params: any) {
    return request<DataResponse>({
      url: '/spc/data',
      method: 'get',
      mock: false,
      data: params
    })
  },
  addHomeData(params:any){
    return request<DataResponse>({
      url: '/spc/data',
      method:'post',
      mock: false,
      data: params,
    })
  },
  editHomeData(params:any){
    return request<DataResponse>({
      url: 'spc/data',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteHomeData(params:any) {
    return request<DataResponse>({
      url: '/spc/data',
      method: 'delete',
      mock: false,
      data:params
    })
  },
  getUserData(params: any) {
    return request<UserResponse>({
    url: '/auth/user',
    method:'get',
    mock: false,
    data: params
    })
  },
  addUser(params:any) {
    return request<UserResponse>({
      url: '/auth/user',
      method:'post',
      mock: false,
      data:params
    })
  },
  editUser(params:any) {
    return request<UserResponse>({
      url: '/auth/user',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteUser(params:any) {
    return request<UserResponse>({
      url: '/auth/user',
      method: 'delete',
      mock: false,
      data:params
    })
  },
  getDepData(params: any) {
    return request<DepResponse>({
      url: '/spc/dep',
      method:'get',
      mock: false,
      data:params
    })
  },
  addDep(params: any) {
    return request<DepResponse>({
      url: '/spc/dep',
      method:'post',
      mock: false,
      data:params
    })
  },
  editDep(params: any) {
    return request<DepResponse>({
      url: '/spc/dep',
      method:'put',
      mock: false,
      data:params
    })
  },
  deleteDep(params: any) {
    return request<DepResponse>({
      url: '/spc/dep',
      method:'delete',
      mock: false,
      data:params
    })
  },
  getProcessData(params: any) {
    return request<ProcessResponse>({
    url: '/spc/process',
    method: 'get',
    mock: false,
    data:params
    })
  },
  addProcess(params: any) {
    return request<ProcessResponse>({
    url: '/spc/process',
    method:'post',
    mock: false,
    data:params
    })
  },
  editProcess(params: any) {
    return request<ProcessResponse>({
      url: '/spc/process',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteProcess(params: any) {
    return request<ProcessResponse>({
      url: '/spc/process',
      method: 'delete',
      mock: false,
      data:params
    })
  },
  getProjectData(params: any) {
    return request<ProjectResponse>({
      url: '/spc/project',
      method:'get',
      mock: false,
      data:params
    })
  },
  addProject(params: any) {
    return request<ProjectResponse>({
      url: '/spc/project',
      method:'post',
      mock: false,
      data:params
    })
  },
  editProject(params: any) {
    return request<ProjectResponse>({
      url: '/spc/project',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteProject(params: any) {
    return request<ProjectResponse>({
    url: '/spc/project',
    method: 'delete',
    mock: false,
    data:params
    })
  },
  getMenu(params: any): Promise<AxiosResponse<MenuResponse>> {
    return request({
      url: '/auth/getMenu',
      method:'post',
      mock: false,
      data:params
    })
  },
  refreshMenu(params: any): Promise<AxiosResponse<MenuResponse>> {
    return request({
      url: 'auth/getMenu',
      method: 'get',
      mock: false,
      data: params
    })
  }
}

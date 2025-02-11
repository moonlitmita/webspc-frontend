/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import request from './request'
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
  samples: string
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
  list?: Array<Data>
  all?: Array<Data>
  total?: number | null
  message: string
  testName: string
  pValue: string
  varianceBetween: string
  varianceWithin: string
}

export interface UserResponse {
  count: number | null
  list: Array<User>
}

export interface DepResponse {
  count: number | null
  list: Array<Dep>
}

export interface ProcessResponse {
  count: number | null
  list: Array<Process>
}

export interface ProjectResponse {
  count: number | null
  list: Array<Project>
}

export default {
  getHomeData(params: any): Promise<AxiosResponse<DataResponse>> {
    return request({
      url: '/spc/data',
      method: 'get',
      mock: false,
      data: params
    })
  },
  addHomeData(params:any): Promise<AxiosResponse<DataResponse>> {
    return request({
      url: '/spc/data',
      method:'post',
      mock: false,
      data: params,
    })
  },
  editHomeData(params:any): Promise<AxiosResponse<DataResponse>> {
    return request({
      url: 'spc/data',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteHomeData(params:any): Promise<AxiosResponse<DataResponse>> {
    return request({
      url: '/spc/data',
      method: 'delete',
      mock: false,
      data:params
    })
  },
  getUserData(params: any): Promise<AxiosResponse<UserResponse>>{
    return request({
    url: '/auth/user',
    method:'get',
    mock: false,
    data: params
    })
  },
  addUser(params:any): Promise<AxiosResponse<UserResponse>> {
    return request({
      url: '/auth/user',
      method:'post',
      mock: false,
      data:params
    })
  },
  editUser(params:any): Promise<AxiosResponse<UserResponse>> {
    return request({
      url: '/auth/user',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteUser(params:any): Promise<AxiosResponse<UserResponse>> {
    return request({
      url: '/auth/user',
      method: 'delete',
      mock: false,
      data:params
    })
  },
  getDepData(params: any): Promise<AxiosResponse<DepResponse>> {
    return request({
      url: '/spc/dep',
      method:'get',
      mock: false,
      data:params
    })
  },
  addDep(params: any): Promise<AxiosResponse<DepResponse>> {
    return request({
      url: '/spc/dep',
      method:'post',
      mock: false,
      data:params
    })
  },
  editDep(params: any): Promise<AxiosResponse<DepResponse>> {
    return request({
      url: '/spc/dep',
      method:'put',
      mock: false,
      data:params
    })
  },
  deleteDep(params: any): Promise<AxiosResponse<DepResponse>> {
    return request({
      url: '/spc/dep',
      method:'delete',
      mock: false,
      data:params
    })
  },
  getProcessData(params: any): Promise<AxiosResponse<ProcessResponse>> {
    return request({
    url: '/spc/process',
    method: 'get',
    mock: false,
    data:params
    })
  },
  addProcess(params: any): Promise<AxiosResponse<ProcessResponse>> {
    return request({
    url: '/spc/process',
    method:'post',
    mock: false,
    data:params
    })
  },
  editProcess(params: any): Promise<AxiosResponse<ProcessResponse>> {
    return request({
      url: '/spc/process',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteProcess(params: any): Promise<AxiosResponse<ProcessResponse>> {
    return request({
      url: '/spc/process',
      method: 'delete',
      mock: false,
      data:params
    })
  },
  getProjectData(params: any): Promise<AxiosResponse<ProjectResponse>> {
    return request({
      url: '/spc/project',
      method:'get',
      mock: false,
      data:params
    })
  },
  addProject(params: any): Promise<AxiosResponse<ProjectResponse>> {
    return request({
      url: '/spc/project',
      method:'post',
      mock: false,
      data:params
    })
  },
  editProject(params: any): Promise<AxiosResponse<ProjectResponse>> {
    return request({
      url: '/spc/project',
      method: 'put',
      mock: false,
      data:params
    })
  },
  deleteProject(params: any): Promise<AxiosResponse<ProjectResponse>> {
    return request({
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
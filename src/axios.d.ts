/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import axios, { Axios, AxiosInstance, AxiosRequestConfig, AxiosResponse, axiosRequestConfig} from "axios"

declare module "axios" {
  interface AxiosResponse<T= any> {
    count: null
    config: {}
    list: []
    all: []
    message: string
    total: number | null
    id: string
    menu: []
    token: string
    p_value: number
    test_name: string
    variance_between: number
    variance_within: number
  }
  export function create(config?: AxiosRequestConfig):AxiosInstance;
}


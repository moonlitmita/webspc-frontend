/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

type EnvType = 'development' | 'test' | 'production'
interface BaseConfig {
  baseApi: string
  mockApi: string
}
interface DevelopmentConfig extends BaseConfig {
//这里可以添加特定于开发环境的额外属性，但在这个例子中它与BaseConfig相同
}
interface TestConfig extends BaseConfig {
//这里可以添加特定于测试环境的额外属性，但在这个例子中它与BaseConfig相同
}
interface ProdConfig extends BaseConfig {
//这里可以添加特定于生产环境的额外属性，但在这个例子中它与BaseConfig相同
}
interface EnvConfigMap {
  development: DevelopmentConfig
  test: TestConfig
  production: ProdConfig
}
const env = import.meta.env.MODE as EnvType || 'production'
const envConfig: EnvConfigMap = {
  development: {
    baseApi: 'http://127.0.0.1:5000/backend',
    mockApi: ''
  },
  test: {
    baseApi: '',
    mockApi : ''
  },
  production: {
    baseApi: 'https://webspc.top/backend',
    mockApi : ''
  }
}
export type AppConfig = {
  env: EnvType
  mock: Boolean
} & BaseConfig
export default {
  env,
  mock: true,
  ...envConfig[env]
} as AppConfig
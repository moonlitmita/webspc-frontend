/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <el-form :model="loginForm" :rules="rules" class="login-container" @keyup.enter.native="login">
    <h3>WebSPC 系统登录</h3>
    <el-form-item>
      <el-input type="input" placeholder="请输入账户 " v-model="loginForm.username">
      </el-input>
    </el-form-item>
    <el-form-item>
      <el-input type="password" placeholder="请输入密码" v-model="loginForm.password">
      </el-input>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="login" :disabled="isButtonDisabled">登录</el-button>
    </el-form-item>
  </el-form>
</template>
<script lang="ts" setup>
import { computed, reactive } from 'vue'
import api from '../api/api'
import type { MenuResponse } from '../api/api'
import {useMainStore} from '../store/index'
import { useRouter ,useRoute} from 'vue-router'
import type { AxiosResponse } from 'axios'
import { ElForm } from 'element-plus'

const mainStore = useMainStore()
const router = useRouter()
const route = useRoute()
const loginForm = reactive({
  username: 'admin',
  password: ''
})
const isButtonDisabled = computed(()=> {
  return !(loginForm.username && loginForm.password)
})
const rules = {
  username: [
    {required: true, message: '请输入用户名', trigger: 'blur'}
  ],
  password: [
    {required: true, message: '请输入密码', trigger: 'blur'}
  ]
}
const login = async()=>{
  const res: AxiosResponse<MenuResponse> = await api.getMenu(loginForm)
  mainStore.persistMenu(res.menu)
  mainStore.addRoutes(res.menu,router)
  mainStore.setToken(res.token)
  router.push(route.query.redirect as string || '/home')
}
</script>
<style lang="less" scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 350px;
  max-width: 350px;
  background-color: #fff;
  border: 1px solid #eaeaea;
  border-radius: 15px;
  padding: 35px 35px 15px 35px;
  box-shadow: 0 0 25px #cacaca;
  h3 {
    text-align: center;
    margin-bottom: 20px;
    color: #505450;
  }
  :deep(.el-form-item__content) {
    justify-content: center;
  }
}
</style>

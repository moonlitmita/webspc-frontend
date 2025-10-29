/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="login-page">
    <el-card class="login-container">
      <h2 class="login-title">WebSPC</h2>
      <el-form
        :model="loginForm"
        :rules="rules"
        label-position="top"
        @keyup.enter.native="login"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="login"
            :disabled="isButtonDisabled"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <div class="footer-info">
      <div>作者: 王宇</div>
      <div>技术支持: 
        <div>Email: wynmamtf@163.com</div>
        <div>QQ: 271989251</div>
        <div>Weixin: valleyfo</div>
      </div>
      <div>
        <a href="https://gitee.com/valleyfo/webspc-frontend" target="_blank" rel="noopener">
          WebSPC前端开源地址
        </a>
      </div>
      <div>
        <a href="https://gitee.com/valleyfo/webspc-backend" target="_blank" rel="noopener">
          WebSPC常规业务后端开源地址
        </a>
      </div>
      <div>版本: v1.0.1</div>
    </div>
    <!-- 底部备案信息 -->
    <!-- <div class="icp-footer">
      <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener">
        XICP备XXXXXXXXXX号
      </a>
      <span class="sep">|</span>
      <a href="https://www.beian.gov.cn/portal/registerSystemInfo" target="_blank" rel="noopener">
        X公网安备XXXXXXXXXXXXXX号
      </a>
    </div> -->
  </div>
</template>
<script lang="ts" setup>
import { computed, reactive } from 'vue'
import api from '../api/mainApi'
import type { MenuResponse } from '../api/mainApi'
import {useMainStore} from '../store/index'
import { useProjectStore } from '../store/project'
import { useLineStore } from '../store/lineData'
import { useRouter ,useRoute} from 'vue-router'
import type { AxiosResponse } from 'axios'
import { ElForm } from 'element-plus'

const mainStore = useMainStore()
const router = useRouter()
const route = useRoute()
const loginForm = reactive({
  username: '',
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
  mainStore.persistMenu(res.data.menu)
  mainStore.addRoutes(res.data.menu,router)
  mainStore.setToken(res.data.token)
  
  // 检查用户是否有项目数据
  try {
    // 获取项目数据
    const projectStore = useProjectStore()
    await projectStore.getProjectData()
    
    // 如果没有项目数据，跳转到项目页面
    if (!projectStore.all || projectStore.all.length === 0) {
      router.push('/project')
      mainStore.currentMenu = {path: "/", name: 'project', label: "项目管理", icon: "Histogram", url: "project/Project"}
    } else {
      // 如果有项目数据，检查lineStore中的cList
      const lineStore = useLineStore()
      // 如果cList为空，也跳转到项目页面
      if (!lineStore.cList || lineStore.cList.length === 0) {
        router.push('/project')
        mainStore.currentMenu = {path: "/", name: 'project', label: "项目管理", icon: "Histogram", url: "project/Project"}
      } else {
        router.push(route.query.redirect as string || '/home')
      }
    }
  } catch (error) {
    // 如果获取项目数据失败，默认跳转到项目页面
    router.push('/project')
  }
}
</script>
<style lang="less" scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  background-image: url('../assets/images/background.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: center;
  align-items: center;
  .login-container {
    width: 400px;
    margin: 100px auto;
    padding: 20px;
    border-radius: 25px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    background-color: rgba(255, 255, 255, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    .login-title {
      text-align: center;
      margin-bottom: 20px;
      font-weight: bold;
      font-size: 24px;
    }
    .login-button {
      width: 100%;
    }
  }
    /* 右下角三行信息样式 */
  .footer-info {
    position: absolute;
    right: 20px;
    bottom: 25px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.75);
    text-align: left;
    line-height: 1.6;

    a {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      display: block;
      transition: color 0.2s;
      &:hover {
        color: #fff;
        text-decoration: underline;
      }
    }

    /* 如需深色背景可取消下面两行注释 */
    // background: rgba(0, 0, 0, 0.2);
    // padding: 5px 8px;
    // border-radius: 4px;
  }
  .icp-footer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    padding: 8px 0;
    background: rgba(0, 0, 0, 0.2);
    font-size: 12px;
    color: #fff;
    text-align: center;
    z-index: 1000;

    a {
      color: #fff;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .sep {
      margin: 0 6px;
    }
  }
}
</style>

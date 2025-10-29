/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <el-header>
    <div class="l-content">
      <el-button size="small"
        type="primary"
        @click="handleCollapse"
        >
        <el-icon :size="20">
          <Expand />
        </el-icon>
      </el-button>
      <el-breadcrumb separator="/" class="bread">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="mainStore.currentMenu.path" v-if="mainStore.currentMenu">{{ mainStore.currentMenu.label }}</el-breadcrumb-item>
      </el-breadcrumb>
      <!-- 新增 AI 按钮 -->
      <div class="ai-content">
        <el-button type="primary" @click="handleToggleAi"size="small">
          AI助手
          <el-icon size="20" class="ai-btn">
            <ChatDotSquare />
          </el-icon>
        </el-button>
      </div>
    </div>
    <div class="r-content">
      <el-dropdown :hide-on-click="false">
        <span class="el-dropdown-link">
          <img class='user' :src="getImageSrc('user')" alt=''/>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">登出</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-header>
</template>
<script lang="ts" setup>
import { useMainStore } from '../../store';
import { useRouter } from 'vue-router'

const mainStore = useMainStore()

const router = useRouter()

const getImageSrc = (name:string) => {
  return new URL(`../../assets/images/${name}.png`, import.meta.url).href
}

const handleCollapse = () => {
  mainStore.updateIsCollapse()
}

const handleToggleAi = () => {
  mainStore.toggleAi()
}

let handleLogout = () => {
  mainStore.clearMenu()
  mainStore.clearToken()
  router.push({
    name:'login'
  })
}
</script>
<style lang="less" scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: #333;
}
.r-content {
  .user {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
}
.l-content {
  display: flex;
  align-items: center;
  .el-button {
    margin-right: 15px;
  }
  .ai-content {
    margin-left: 20px;
    align-items: center;
    .ai-btn {
      margin-left: 3px;
    }
  }
}
.bread :deep(span){
  color: #fff !important;
  cursor: pointer !important;
}
</style>
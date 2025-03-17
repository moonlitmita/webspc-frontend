/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <el-header>
    <div class="l-content">
      <el-button size="small"
        @click="handleCollapse">
        <el-icon :size="20">
          <Expand />
        </el-icon>
      </el-button>
      <el-breadcrumb separator="/" class="bread">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="current.path" v-if="current">{{ current.label }}</el-breadcrumb-item>
      </el-breadcrumb>
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
import { storeToRefs } from 'pinia';
import { computed } from '@vue/reactivity';
import { useRouter } from 'vue-router'

const mainStore = useMainStore()
const router = useRouter()
const getImageSrc = (name:string) => {
  return new URL(`../../assets/images/${name}.png`, import.meta.url).href
}
const handleCollapse = () => {
  mainStore.updateIsCollapse()
}
const current = computed(()=>{
  return mainStore.currentMenu
})
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
  h3 {
    color: #fff;
  }
}
.bread :deep(span){
  color: #fff !important;
  cursor: pointer !important;
}
</style>
/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <el-aside :width="inDrawer ? '100%' : (imCollapse ? '80px' : '200px')">
    <el-menu
      class="el-menu-vertical-demo"
      background-color="#545c64"
      text-color="#fff"
      :collapse = "inDrawer ? false : imCollapse"
      :collapse-transition="false"
    >
      <h3 v-show="inDrawer ? false : imCollapse">SPC</h3>
      <h3 v-show="inDrawer ? true : !imCollapse">SPC管理</h3>
        <el-menu-item 
          :index="item.path" 
          v-for="item in noChildren()" 
          :key="item.path"
          @click="clickMenu(item)"
        >
          <component class="icons" :is="item.icon"></component>
          <span>{{item.label}}</span>
        </el-menu-item>
    </el-menu>
  </el-aside>
</template>
<script lang="ts" setup>
import { useRouter } from "vue-router";
import {useMainStore} from "../../store"
import { storeToRefs } from "pinia";
import type { Tab } from "../../api/mainApi"
const mainStore = useMainStore()

let {isCollapse: imCollapse} = storeToRefs(mainStore)
const router = useRouter()

defineProps<{
  inDrawer?: boolean
}>()
const emit = defineEmits<{
  (e: 'navigate'): void
}>()

const noChildren = () => {
  return mainStore.menu.filter((item)=>!item.children)
}
const hasChildren = () => {
  return mainStore.menu.filter((item)=> item.children)
}
const clickMenu = (item: Tab) => {
  router.push({name:item.name})
  mainStore.selectMenu(item)
  emit('navigate')
}
</script>
<style lang="less">
.icons {
  width:18px;
  height:18px;
}
.el-menu {
  height: 100%;
  display: grid;
  border-right: 0px;
}
h3 {
  line-height: 48px;
  text-align: center;
  color: #fff;
}
</style>

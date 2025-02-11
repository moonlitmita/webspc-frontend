/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="tags">
    <el-tag 
      :key="tag.name"
      v-for="(tag,index) in tags"
      :closable="tag.name!=='home'"
      :disable-transitions="false"
      :effect="$route.name==tag.name?'dark':'plain'"
      @click="changeMenu(tag)"
      @close="handleClose(tag,index)">
      {{ tag.label }}
    </el-tag>
  </div>
  </template>
  <script lang="ts" setup>
  import { useMainStore } from '../../store/index';
  import { computed } from '@vue/reactivity';
  import { useRouter,useRoute } from 'vue-router';
  import type { Tab } from '../../api/api'
  const mainStore = useMainStore();
  const router = useRouter()
  const route = useRoute()
  const tags = computed(()=>{
    return mainStore.tabsList
  })
  const changeMenu = (item: Tab) => {
    router.push({
      name: item.name
    })
  }
  const handleClose = (tag: Tab, index: number) =>{
    let length = tags.value.length-1
    mainStore.closeTab(tag)
    if(tag.name!==route.name) {
      return
    }
    if(index==length) {
      router.push({
        name:tags.value[index-1].name
      })
    } else {
      router.push({
        name:tags.value[index].name
      })
    }
  }
  </script>
  <style lang="less" scoped>
  .tags {
    flex: 0 1 auto;
    padding:10px;
    width:100%;
    .el-tag{
      margin-right: 15px;
      cursor: pointer;
    }
  }
  </style>
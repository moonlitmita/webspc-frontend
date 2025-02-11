/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="spc-container">
    <div class="info">
      <el-row>
        <el-col :span="24">
          <el-text class="mx-1" type="primary" size="large" style="text-align: center;">
            <h1>{{ project }}</h1>
          </el-text>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-text class="mx-1" type="primary" truncated>
            产品：{{ product }}
          </el-text>
        </el-col>
        <el-col :span="8">
          <el-text class="mx-1" type="primary" truncated>
            上公差限：{{ uSpecLimit }}
          </el-text>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="8">
          <el-text class="mx-1" type="primary" truncated>
            制程：{{ process }}
          </el-text>
        </el-col>
        <el-col :span="8">
          <el-text class="mx-1" type="primary" truncated>
            下公差限：{{ lSpectLimit }}
          </el-text>
        </el-col>
      </el-row>
    </div>
    <div class="tab-content">
      <el-tabs 
        v-model = "mainStore.currentTab"
        type = "card"
        @tab-click = "changeTab"
        class="my-tabs"
      >
        <el-tab-pane
          v-for = "(item,index) in tabData"
          :key = "item.id"
          :label =  "item.label"
          :name = "item.id"
        >
          <component :is="item.tabCom" v-if="mainStore.currentTab==item.id"></component>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script lang = 'ts' setup>
import { ref,defineAsyncComponent,shallowRef } from 'vue'
import { useMainStore } from '../../store';
import {useLineStore} from '../../store/lineData'
  
const mainStore = useMainStore()
const lineStore = useLineStore()
const process = ref()
const product = ref()
const project = ref()
const uSpecLimit = ref()
const lSpectLimit = ref()
const setData = ()=> {
  process.value = lineStore.process
  product.value = lineStore.product
  project.value = lineStore.projectName
  uSpecLimit.value = lineStore.USL
  lSpectLimit.value = lineStore.LSL
}
const tabData = shallowRef([
  { 
    label: 'SPC',
    id: 0,
    tabCom: defineAsyncComponent(()=>import('../../components/content/Chart.vue'))
  },
  {
    label : '数据',
    id: 1,
    tabCom: defineAsyncComponent(()=> import('../../components/content/spcData/ChartData.vue'))
  }
])
const changeTab = ()=> {
}
setData()
</script>
<style scoped>
* {
  padding: 0;
  margin: 0;
}
.spc-container {
  flex: 1 1 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  :deep(.el-tabs__header) {
    margin: 0;
  }
  :deep(.el-tabs__content) {
    flex: 1;
    display: flex;
    .el-tab-pane {
      flex: 1;
      display: flex;
    }
  }
  .tab-content {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    .my-tabs {
      flex: 1 1 auto;
      display: flex; 
      flex-direction: column;
    --el-tabs-header-height: 30px;
    .el-tabs__content {
      display: flex;
      flex-direction: row;
      .el-tab-pane {
        flex: 1;
      }
    }
    }
    .info {
      position: sticky;
      top: 0;
      flex: 1 1 auto;
    }
  }
}
</style>
  
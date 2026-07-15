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
      <el-row :gutter="10" style="margin-bottom: 10px;">
        <el-col :xs="6" :sm="8">
          <el-text class="mx-1" type="primary" truncated>
            产品：{{ product }}
          </el-text>
        </el-col>
        <el-col :xs="6" :sm="4">
          <el-text class="mx-1" type="primary" truncated>
            上公差限：{{ uSpecLimit }}
          </el-text>
        </el-col>
        <el-col :xs="6" :sm="8" style="display: flex; align-items: center; justify-content: flex-end;">
          <template v-if="lineStore.dataCollectionType === '自动采集'">
            <el-text class="mx-1" type="primary" style="margin-right: 8px;">LLM监控&实时数据流</el-text>
            <el-switch
              :model-value="mainStore.isRealTimeMode"
              @update:model-value="handleRealTimeModeChange"
              active-text="On"
              inactive-text="Off"
              size="small"
            />
          </template>
        </el-col>
        <el-col :xs="6" :sm="4" class="btn-wrapper">
          <template v-if="lineStore.dataCollectionType === '手动采集'">
            <el-button
              type="primary"
              size="large"
              @click="lineStore.triggerAlarm"
              style="margin-right: 8px;"
            >
              LLM告警
            </el-button>
          </template>
        </el-col>
      </el-row>
      <el-row :gutter="10">
        <el-col :xs="24" :sm="8">
          <el-text class="mx-1" type="primary" truncated>
            制程：{{ process }}
          </el-text>
        </el-col>
        <el-col :xs="14" :sm="4">
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
import { ref,defineAsyncComponent,shallowRef, onMounted, onUnmounted, watch } from 'vue'
import { useMainStore } from '../../store';
import { useLineStore } from '../../store/lineData'
import { useAlarmStore } from '../../store/alarm'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const mainStore = useMainStore()
const lineStore = useLineStore()
const router = useRouter()
const process = ref()
const product = ref()
const project = ref()
const uSpecLimit = ref()
const lSpectLimit = ref()

// 检查项目信息
const checkLineData = async () => {
  try {
    // 初次加载数据(初次登录，或删除本地数据后)，检查是否是从Project.vue跳转过来的（通过检查必要的属性是否已设置）
    const isFromProject = lineStore.spcType && lineStore.spcType.length > 0 &&
                          lineStore.process && lineStore.process.length > 0 &&
                          lineStore.product && lineStore.product.length > 0;
    
    // 如果不是从Project.vue跳转过来的，检查cList是否为空
    if (!isFromProject && (!lineStore.cList || lineStore.cList.length === 0)) {
      ElMessage({
        message: '当前页面没有数据加载，请点击控制图按钮',
        type: 'warning'
      })
      router.push('/project')
      mainStore.currentMenu = {path: "/project", name: 'project', label: "项目管理", icon: "Histogram", url: "project/Project"}
      return false
    } else {
      // 如果是从Project.vue跳转过来的，确保cList已正确设置(暂时用不到)
      // if (isFromProject && (!lineStore.cList || lineStore.cList.length === 0)) {
        // 调用getDynamicComponentsList来填充cList
        // lineStore.getDynamicComponentsList()
      // }
      //非初次加载或从project.vue跳转过来返回true
      return true
    }
  } catch (error) {
    // 如果检查过程中出现错误，默认跳转到项目页面
    ElMessage({
      message: '当前页面没有数据加载，请点击控制图按钮',
      type: 'warning'
    })
    router.push('/project')
    mainStore.currentMenu = {path: "/project", name: 'project', label: "项目管理", icon: "Histogram", url: "project/Project"}
    return false
  }
}

const setData = ()=> {
  process.value = lineStore.process
  product.value = lineStore.product
  project.value = lineStore.projectName
  uSpecLimit.value = lineStore.USL
  lSpectLimit.value = lineStore.LSL

  // 如果不是自动采集，则禁用实时模式
  if (lineStore.dataCollectionType !== '自动采集') {
    mainStore.isRealTimeMode = false;
    stopUpdateData();
  }
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

let updateInterval: number | null = null

const stopUpdateData = () => {
  if(updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
}

const startUpdateData = () => {
  // 先停止任何现有的定时器
  stopUpdateData()
  updateInterval = window.setInterval(() => {
    lineStore.loadData(true)
    lineStore.triggerAlarm()
  }, 1000)
}



//以下暂时不用
// const toggleAllRealTimeMode = () => {
//   const newValue = !mainStore.isRealTimeMode;
//   mainStore.isRealTimeMode = newValue;
//   if (newValue) {
//     startUpdateData()
//   } else {
//     stopUpdateData()
//   }
// }

const handleRealTimeModeChange = (value: boolean) => {
  // 更新 store 中的实时模式状态
  mainStore.isRealTimeMode = value
  if (value) {
    startUpdateData()
  } else {
    stopUpdateData()
  }
}

// 在组件挂载时检查项目数据
onMounted(async () => {
  const hasLineData = await checkLineData()
  if (hasLineData) {
    setData()
    // 如果不是自动采集，则禁用实时模式
    if (lineStore.dataCollectionType !== '自动采集') {
      mainStore.isRealTimeMode = false;
      stopUpdateData();
    } else {
      // 检查刷新后是否需要重新启动实时模式
      if (mainStore.isRealTimeMode) {
        startUpdateData()
      }
    }
  }
})

// 监听 dataCollectionType 变化，如果不是自动采集，则禁用实时模式
watch(() => lineStore.dataCollectionType, (newVal) => {
  if (newVal !== '自动采集') {
    mainStore.isRealTimeMode = false
    stopUpdateData()
  }
})

// 在组件卸载时清理定时器
onUnmounted(() => {
  if(updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
  }
})
</script>
<style scoped>
* {
  padding: 0;
  margin: 0;
}
.spc-container {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .info {
    /* 1. 减小按钮上下内边距 → 文字离上下边缘更近 */
    .btn-wrapper :deep(.el-button--large) {
      padding-top: 6px;
      padding-bottom: 6px;
      padding-left: 6px;
      padding-right: 6px;
      height: auto;   /* 让高度随内容走 */
    }
  }
  :deep(.el-tabs__header) {
    margin: 0;
  }
  :deep(.el-tabs__content) {
    flex: 1;
    .el-tab-pane {
      height: 100%;
    } 
  }
  
  .tab-content {
    height: 100%;
    .my-tabs {
      height: 100%;
      --el-tabs-header-height: 30px;
      :deep(.el-tabs__content) {
        flex: 1;
      } 
      .el-tabs__content {
        display: flex;
        .el-tab-pane {
          flex: 1;
        }
      }
    } 
  }
}
</style>

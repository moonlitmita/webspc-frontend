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
import { ref,defineAsyncComponent,shallowRef, onMounted } from 'vue'
import { useMainStore } from '../../store';
import {useLineStore} from '../../store/lineData'
import { useProjectStore } from '../../store/project'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
  
const mainStore = useMainStore()
const lineStore = useLineStore()
const projectStore = useProjectStore()
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
      mainStore.currentMenu = {path: "/", name: 'project', label: "项目管理", icon: "Histogram", url: "project/Project"}
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
    mainStore.currentMenu = {path: "/", name: 'project', label: "项目管理", icon: "Histogram", url: "project/Project"}
    return false
  }
}

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

// 在组件挂载时检查项目数据
onMounted(async () => {
  const hasLineData = await checkLineData()
  if (hasLineData) {
    setData()
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
  display: flex;
  flex-direction: column;
  align-items: stretch;
  .info {
    padding-top: 5px;
  }
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

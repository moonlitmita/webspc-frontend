/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="chart-container">
    <div class="dynamic-charts">
      <el-card>
        <div v-for="item in cList" class="dynamic-item">
          <Suspense>
            <template #default>
              <component :is="item.cName" :key="item.cName"></component>
            </template>
            <template #fallback>
              <div class="loading-container">
                <div class="loading-spinner">
                  <div class="spinner-circle"></div>
                  <p class="loading-text">图表加载中...</p>
                </div>
              </div>
            </template>
          </Suspense>
        </div>
      </el-card>
    </div>
    <div class="fixed-container">
      <el-collapse v-model="isActiveName" accordion class="my-collapse">
        <el-collapse-item title="数据分析" name="固定图表">
          <div class="fixed-charts">
            <div class="chart-item_1">
              <Suspense>
                <template #default>
                  <Normal />
                </template>
                <template #fallback>
                  <div>Loading chart...</div>
                </template>
              </Suspense>
            </div>
            <div class="chart-item_2">
              <Suspense>
                <template #default>
                  <Pareto />
                </template>
                <template #fallback>
                  <div>Loading chart...</div>
                </template>
              </Suspense>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useMainStore } from '../../store';
import { defineAsyncComponent, ref, shallowRef, markRaw, watch } from 'vue';
import{ useRoute } from 'vue-router'
import type {RouteLocationNormalized, LocationQueryValue} from 'vue-router'
import { useLineStore } from '../../store/lineData'

const lineStore = useLineStore()

interface ComponentList {
  label: LocationQueryValue
  cName: any // Using any to allow dynamic components
}

const route: RouteLocationNormalized = useRoute()
const mainStore = useMainStore()
const cList = shallowRef<ComponentList[] | undefined>([])
const isActiveName = ref('1')

// Dynamically import components to keep bundle small
const Normal = defineAsyncComponent(() => import('./chart/Normal.vue'))
const Pareto = defineAsyncComponent(() => import('./chart/Pareto.vue'))

// Get the dynamic components list
lineStore.getDynamicComponentsList()

// Process the component list to make them async
const processComponentList = () => {
  const processed = lineStore.cList.map(item => {
    let component;
    // Normalize the label to handle different possible formats
    const normalizedLabel = item.label ? item.label.toString().toUpperCase() : '';

    switch(normalizedLabel) {
      case 'XBAR':
        component = defineAsyncComponent(() => import('./chart/Xbar.vue'));
        break;
      case 'R':
        component = defineAsyncComponent(() => import('./chart/R.vue'));
        break;
      case 'I':
        component = defineAsyncComponent(() => import('./chart/I.vue'));
        break;
      case 'MR':
        component = defineAsyncComponent(() => import('./chart/MR.vue'));
        break;
      default:
        // Fallback for unknown components
        component = defineAsyncComponent(() => import('./chart/Xbar.vue'));
    }

    return {
      ...item,
      cName: markRaw(component)
    };
  });

  cList.value = processed;
};

// Watch for changes in lineStore.cList and update the component list accordingly
watch(() => lineStore.cList, (newList) => {
  if (newList && newList.length > 0) {
    processComponentList();
  }
}, { immediate: true });
</script>
<style lang="less" scoped>
.chart-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0; /* 允许flex项收缩 */
  overflow: hidden; /* 防止内容直接溢出到父容器 */
  .dynamic-charts {
    // 让它成为 loading 的“定位上下文”
    position: relative;  
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 200px; /* Provide a reasonable minimum height */
    .el-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0; /* Allow this flex item to shrink */
      :deep(.el-card__body) {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0;
        min-height: 0; /* Allow this flex item to shrink */
        .dynamic-item {
          flex: 1; /* Each chart takes equal space */
          display: flex;
          flex-direction: column;
          min-width: 600px; // Ensure minimum width for charts
          // 给每个图表一个“占位”高度，避免加载前 0 高
          min-height: 100px; // Allow flex shrinking
          position: relative;    // 让 loading 相对它定位
          /* ===== 加载状态 start ===== */
          .loading-container {   // 对应 <Suspense #fallback> 里的最外层 div
            position: absolute;
            inset: 0;            // top/right/bottom/left: 0
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(255, 255, 255, .95);
            backdrop-filter: blur(2px);
            z-index: 10;
            
            .loading-spinner {
              text-align: center;
              padding: 30px;
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, .1);
              
              .spinner-circle {
                width: 50px;
                height: 50px;
                margin: 0 auto 16px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #409eff;
                border-right: 4px solid #67c23a;
                border-bottom: 4px solid #e6a23c;
                border-radius: 50%;
                animation: spin 1.2s linear infinite;
              }
              
              .loading-text {
                color: #606266;
                font-size: 14px;
                margin: 0;
                animation: pulse 1.5s ease-in-out infinite;
              }
            }
          }
          /* ===== 加载状态 end ===== */
          .js-plotly-plot {
            flex: 1;
            display: flex;
            flex-direction: column;
            .plot-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              .user-select-none {
                flex: 1;
                .main-svg {
                  flex: 1;
                }
              }
            }
          }
        }
      }
    }
  }
  .fixed-container {
    background-color: lightblue;
    .my-collapse {
      height: 100%;
      box-sizing: border-box;
      border-top: 0px;
      :deep(.el-collapse) {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .el-collapse-item {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        :deep(.el-collapse-item__header) {
          border-bottom: 0px;
          padding-top: 0px;
          --el-collapse-header-height: 30px;
          --el-collapse-header-bg-color: lightblue;
        }
        .el-collapse-item__wrap {
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          .el-collapse-item__content {
            box-sizing: border-box;
            padding-bottom: 0px;
            flex: 1;
            display: flex;
            overflow-y: auto; // 如果内容超出，显示滚动条在折叠项目内部而不是main-content
            .fixed-charts {
              flex: 1;
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
              grid-template-rows: 1fr 1fr;
              box-sizing: border-box;
              .chart-item_1 {
                grid-area: 1 / 1 / 2 / 4;
                box-sizing: border-box;
                .js-plotly-plot {
                  display: flex;
                  flex-direction: column;
                  box-sizing: border-box;
                  .plot-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    .user-select-none {
                      flex: 1;
                      box-sizing: border-box;
                    }
                  }
                }
              }
              .chart-item_2 {
                grid-area: 2 / 1 / 3 / 4;
                box-sizing: border-box;
                .js-plotly-plot {
                  display: flex;
                  flex-direction: column;
                  box-sizing: border-box;
                  .plot-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    box-sizing: border-box;
                    .user-select-none {
                      flex: 1;
                      box-sizing: border-box;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  // 动画关键帧放在最外层，避免嵌套生成重复前缀
  @keyframes spin {
    0%  { transform: rotate(0deg); }
    100%{ transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100%{ opacity: .7; }
    50%      { opacity: 1; }
  }
}
</style>
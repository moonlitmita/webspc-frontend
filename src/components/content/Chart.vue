/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="chart-container">
    <div class="dynamic-charts">
      <el-card>
        <div v-for="item in cList" class="dynamic-item">
          <component :is="item.cName" :key="item.cName"></component>
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
import { defineAsyncComponent, ref, shallowRef, markRaw } from 'vue';
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

// Process components after loading
lineStore.getDynamicComponentsList();
processComponentList();
</script>
<style lang="less" scoped>
.chart-container {
  flex: 1 1 auto;
  display: flex;
  flex-wrap: nowrap;
  height: 100%;
  width: 100%;
  flex-direction: column;
  .dynamic-charts {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    .el-card {
      flex: 1 1 auto;
      display: flex;
      :deep(.el-card__body) {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0;
        .dynamic-item {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
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
      .el-collapse-item {
        height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        :deep(.el-collapse-item__header) {
          border-bottom: 0px;
          padding-top: 0px;
          --el-collapse-header-height: 30px;
          --el-collapse-header-bg-color: lightblue;
        }
        .el-collapse-item__wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          .el-collapse-item__content {
            box-sizing: border-box;
            padding-bottom: 0px;
            flex: 1;
            display: flex;
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
}
</style>
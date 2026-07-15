/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import {defineStore} from 'pinia'
import api from '../api/mainApi'
import type { Data, DataResponse } from '../api/mainApi'
import { defineAsyncComponent, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { useAlarmStore } from './alarm'
import { strToUnix } from '@/utils/commonTools'

interface Component {
  label: string
  cName: ReturnType<typeof defineAsyncComponent>
}
export interface Outlier {
    x: number;
    y: number;
    message: string;
    add_date: string;
  }
interface DataConfig {
  chartDataList_pagination: DataResponse['data']['list']
  chartDataList_all: DataResponse['data']['all']
  date: Array<string>
  xData: Array<number>
  yData: Array<Array<number>>
  config: {
    total: number | null
    page: number
    pageSize: number
    project_id: string
    startDate: Date | string | null
    endDate: Date | string | null
  }
  spcType: Array<string>
  process: string
  product: string
  projectName: string
  sampleSize: number
  USL: number
  LSL: number
  iUCL: number
  iLCL: number
  mrUCL: number
  mrLCL: number
  rUCL: number
  rLCL: number
  xbarUCL: number
  xbarLCL: number
  selectedChecks: Array<string>
  dataCollectionType: string
  cList: Array<Component>
  testName: string
  pValue: string | null
  varianceBetween: string | null
  varianceWithin: string | null
  iOutliers: Outlier[]
  mrOutliers: Outlier[]
  rOutliers: Outlier[]
  xbarOutliers: Outlier[]
  newOutliers: Outlier[]
  lastAddedTimestamp: string
}

export const useLineStore=defineStore('line',{
  state: (): DataConfig => {
    return {
      chartDataList_pagination: [],
      chartDataList_all: [],
      date: [],
      xData: [],
      yData: [],
      config: {
        total: 0,
        page:1,
        pageSize: 10,
        project_id: "",
        startDate: "",
        endDate: ""
      },
      spcType: [],
      process: "",
      product: "",
      projectName: "",
      sampleSize: 1,
      USL: 0,
      LSL: 0,
      iUCL: 0,
      iLCL: 0,
      mrUCL: 0,
      mrLCL: 0,
      rUCL: 0,
      rLCL: 0,
      xbarUCL: 0,
      xbarLCL: 0,
      selectedChecks: [],
      dataCollectionType: "",
      cList: [],
      testName: '',
      pValue: '',
      varianceBetween: '',
      varianceWithin: '',
      iOutliers: [],
      mrOutliers: [],
      rOutliers: [],
      xbarOutliers: [],
      newOutliers: [],
      lastAddedTimestamp: ""
    }
  },
  getters: {
    xBarMean: (state)=> {
      const yMeans: Array<number> = [];
      for (let i = 0; i < state.yData.length; i++) {
        let sum = state.yData[i].reduce((a, b) => a + b, 0);
        let yMean = sum / state.yData[i].length;
        yMeans.push(yMean);
      }
      let xBarMean = yMeans.reduce((a, b) => a + b, 0) / yMeans.length;
      return {yMeans,xBarMean};
    },
    rBar:(state)=> {
      let rBar = 0;
      let rValue = []
      for (let i = 0; i < state.yData.length; i++) {
        let range = Math.max(...state.yData[i]) - Math.min(...state.yData[i]);
        rValue.push(range)
        rBar += range;
      }
      rBar /= state.yData.length;
      return {rValue,rBar};
    },
    mrData(): {movingRanges:number[],mrBar: number} {
      const movingRanges: number[] = [];
      const yValue = this.xBarMean.yMeans
      for (let i = 1; i < yValue.length; i++) {
        const range = Math.abs(yValue[i] - yValue[i - 1]);
        movingRanges.push(range);
      }
      const mrBar = movingRanges.reduce((sum, value) => sum + value, 0) / movingRanges.length;
      return {movingRanges, mrBar};
    },
    // xUCL(): number {
    //   const xBarMean = this.xBarMean.xBarMean
    //   const mrBar = this.mrData.mrBar
    //   return (xBarMean + 3*mrBar/getD2(2))
    // },
    // xLCL(): number {
    //   const xBarMean = this.xBarMean.xBarMean
    //   const mrBar = this.mrData.mrBar
    //   return (xBarMean - 3*mrBar/getD2(2))
    // },
    // mrUCL(): number {
    //   const mrBar = this.mrData.mrBar
    //   return getD4(2)*mrBar
    // },
    // mrLCL(): number {
    //   const mrBar = this.mrData.mrBar
    //   return getD3(2)*mrBar
    // },
    selectedRules: (state)=> {
      const numberToString: Record<string, string> = {
        '1': 'isOutsideControlLimits',
        '2': 'isConsecutivePointsSameSide',
        '3': 'isConsecutiveIncreasingOrDecreasingPoints',
        '4': 'isAlternatingPoints',
        '5': 'isOutsideControlZoneB',
        '6': 'isOutsideControlZoneC',
        '7': 'isInsideControlZoneC',
        '8': 'isOutsideControlZoneCandBothSides'
      }
      const mappedRules = state.selectedChecks.map(item => {
        return numberToString[item] || 'Unknown'
      })
      return mappedRules
    }
  },
  actions: {
    async loadData(getAll: boolean): Promise<void> {
      try {
        const res: DataResponse = await api.getHomeData({...this.config, getAll:getAll}) 
        if (!res) return  //该行代码用于阻拦token过期后跳转登录页面错误冒泡
        if(res.data) {
          if(getAll) {
            if (!res.data.all) {
              ElMessage.warning('数据为空,请录入数据!')
              return
            }
            this.chartDataList_all = res.data.all 
            this.xData = res.data.all.map((_, index)=> index + 1)
            this.yData = res.data.all.map(({samples}) => samples)
            this.date = res.data.all.map(({add_date})=> add_date)
            this.testName = res.data.test_name
            // 修正pValue的赋值逻辑，支持数值类型和字符串类型
            if (res.data.p_value !== undefined && res.data.p_value !== null) {
              const pValueNum = typeof res.data.p_value === 'string' ? parseFloat(res.data.p_value) : Number(res.data.p_value);
              this.pValue = !isNaN(pValueNum) && isFinite(pValueNum) ? pValueNum.toFixed(3) : null;
            } else {
              this.pValue = null;
            }
            // 修正varianceBetween的赋值逻辑
            if (res.data.variance_between !== undefined && res.data.variance_between !== null) {
              const varianceBetweenNum = typeof res.data.variance_between === 'string' ? parseFloat(res.data.variance_between) : Number(res.data.variance_between);
              this.varianceBetween = !isNaN(varianceBetweenNum) && isFinite(varianceBetweenNum) ? varianceBetweenNum.toFixed(3) : null;
            } else {
              this.varianceBetween = null;
            }
            // 修正varianceWithin的赋值逻辑
            if (res.data.variance_within !== undefined && res.data.variance_within !== null) {
              const varianceWithinNum = typeof res.data.variance_within === 'string' ? parseFloat(res.data.variance_within) : Number(res.data.variance_within);
              this.varianceWithin = !isNaN(varianceWithinNum) && isFinite(varianceWithinNum) ? varianceWithinNum.toFixed(3) : null;
            } else {
              this.varianceWithin = null;
            }
            if(res.data.all.length === 0) {
              ElMessage.warning('数据为空,请录入数据!')
              return
            } 
          } else {
            this.config.total = res.data.total ?? null
            this.chartDataList_pagination = res.data.list ?? []
          }
        } else {
          ElMessage.error('数据加载失败！')
        }
      } catch (error) {
        ElMessage.error('数据加载失败！')
      }
    },
    async addHomeData(val: any) {
      try {
        const res = await api.addHomeData(val)

        // After adding new data, we need to reload data to get the updated dataset
        // and potentially identify new outliers in the recently added data
        // For now, we'll just return the response
        return res.data
      } catch (error: any) {
        // 传递错误信息，让调用方决定如何展示
        throw error
      }
    },
    async editHomeData(val: any) {
      const res = await api.editHomeData(val)
      return res.data
    },
    async deleteHomeData(val: any) {
      const res = await api.deleteHomeData(val)
      return res.data
    },
    getDynamicComponentsList() {
      const modules = import.meta.glob(`../components/content/chart/*.vue`)
      const dynamicComponentsList=(params: Array<string>): Array<Component>=>{ 
      const cNameList = params.map((r)=>{
        const componentName: Component = {
          label: r,
          cName: markRaw(defineAsyncComponent(()=> import(`../components/content/chart/${r}.vue`)))
        }
        return componentName
        })
        return cNameList
      }
      let res:Array<Component> = dynamicComponentsList(this.spcType)
      this.cList = []
      this.cList.push(...res)
    },
    cleaniOutliers() {
      this.iOutliers = []
    },
    cleanmrOutliers() {
      this.mrOutliers = []
    },
    cleanrOutliers() {
      this.rOutliers = []
    },
    cleanxbarOutliers() {
      this.xbarOutliers = []
    },
    cleanNewOutliers() {
      this.newOutliers = []
    },
    setLastAddedTimestamp() {
      this.lastAddedTimestamp = this.date[this.date.length - 1]
    },
    updateiCL(upperLimit: number, lowerLimit: number) {
      this.iUCL = upperLimit
      this.iLCL = lowerLimit
    },
    updatemrCL(upperLimit: number, lowerLimit: number) {
      this.mrUCL = upperLimit
      this.mrLCL = lowerLimit
    },
    updaterCL(upperLimit: number, lowerLimit: number) {
      this.rUCL = upperLimit
      this.rLCL = lowerLimit
    },
    updatexbarCL(upperLimit: number, lowerLimit: number) {
      this.xbarUCL = upperLimit
      this.xbarLCL = lowerLimit
    },
    // 手动触发告警逻辑
    async triggerAlarm() {

      const alarmStore = useAlarmStore()

      // 获取保存的最后时间戳
      const lastSavedTimestamp = strToUnix(this.lastAddedTimestamp)

      if (lastSavedTimestamp) {
        // Filter all outlier arrays to only include outliers with timestamps greater than the last saved timestamp
        this.newOutliers = [
          ...this.iOutliers.filter(outlier => strToUnix(outlier.add_date) > lastSavedTimestamp),
          ...this.mrOutliers.filter(outlier => strToUnix(outlier.add_date) >= lastSavedTimestamp),
          ...this.rOutliers.filter(outlier => strToUnix(outlier.add_date) > lastSavedTimestamp),
          ...this.xbarOutliers.filter(outlier => strToUnix(outlier.add_date) > lastSavedTimestamp)
        ]
      } else {
        this.newOutliers = []
        this.setLastAddedTimestamp()
      }

      // 如果没有检测到异常数据点，提示用户
      if (this.newOutliers.length === 0) {
        if (this.dataCollectionType === "手动采集") {
          ElMessage.info('当前没有检测到新增异常数据点')
        } 
        return
      }

      // 构建告警数据
      const alarmData = {
        title: "SPC数据异常告警",
        content: `检测到${this.newOutliers.length}个新增异常数据点，需要进行分析处理`,
        outliers: this.newOutliers,
        project: this.projectName,
        process: this.process,
        product: this.product,
        spcType: this.spcType,
        additional_info: {
          timestamp: new Date().toISOString()
        }
      }

      // 使用告警store来处理分析
      await alarmStore.analyzeAlarm(alarmData)

      // 清空newOutliers
      this.cleanNewOutliers()

      // 设置新的最后新增时间戳
      this.setLastAddedTimestamp()
    }
  },
  persist: true
})


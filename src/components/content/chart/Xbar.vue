/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { useLineStore } from '../../../store/lineData'
import type { Outlier } from '../../../store/lineData'
import { useMainStore } from '../../../store';
import { getD2, cp_pp, cpk_ppk, calculateSampleStandardDeviation } from '../../../utils/statistics'
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints,
  isOutsideControlZoneB, isOutsideControlZoneC, isInsideControlZoneC, isOutsideControlZoneCandBothSides
 } from '../../../utils/rules'

const lineStore = useLineStore()
const mainStore = useMainStore()
const xBar = ref()
let Plotly: PlotlyType | null = null
const sampleSize = lineStore.sampleSize
const USL = lineStore.USL
const LSL = lineStore.LSL
const mean = ref(0)
const sigma_group = ref()
const sigma_overall = ref()
const upperLimit = ref(0)
const lowerLimit  = ref(0)
const cp = ref(0)
const cpk = ref(0)
const pp = ref(0)
const ppk = ref(0)
const flatData = lineStore.yData.flat()

const updateDynamicLimits= ()=> {
  const result = Math.sqrt(sampleSize)
  mean.value = Number(lineStore.xBarMean.xBarMean.toFixed(2))
  sigma_group.value = ((1/result)*(lineStore.rBar.rBar)/getD2(sampleSize)).toFixed(2)
  sigma_overall.value = calculateSampleStandardDeviation(lineStore.yData.flat(), mean.value).toFixed(2)
  upperLimit.value = mean.value + 3*sigma_group.value
  lowerLimit.value = mean.value - 3*sigma_group.value
  lineStore.updatexbarCL(upperLimit.value, lowerLimit.value)
  cp.value = Number(cp_pp(USL,LSL,sigma_group.value).toFixed(2))
  pp.value = Number(cp_pp(USL,LSL,sigma_overall.value).toFixed(2))
  cpk.value = Number(cpk_ppk(USL, LSL, mean.value, sigma_group.value).toFixed(2))
  ppk.value = Number(cpk_ppk(USL, LSL, mean.value, sigma_overall.value).toFixed(2))
}

const renderChart = async () => {
  // Load Plotly if not already loaded
  if (!Plotly) {
    Plotly = await loadPlotly();
  }

  updateDynamicLimits()
  let Data1 = {
    type: 'scatter',
    x: lineStore.xData,
    y: lineStore.xBarMean.yMeans,
    mode: 'lines+markers',
    name: 'Data',
    showlegend: false,
    hoverinfo: 'text',
    hovertemplate: '<b>Date:</b> %{customdata}<br><b>X:</b> %{x}<br><b>Y:</b> %{y}<extra></extra>',
    line: {
      color: 'blue',
      width: 2
    },
    marker: {
      color: 'blue',
      size: 8,
      symbol: 'circle'
    },
    customdata: lineStore.date
  } as any // Using 'any' since we're loading Plotly dynamically
  let xBarUCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(upperLimit.value),
    mode: 'lines',
    name: 'Xbar UCL',
    showlegend: false,
    line: {
      color: 'green',
      dash: 'dash',
      width: 1
    }
  } as any

  let xBarLCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(lowerLimit.value),
    mode: 'lines',
    name: 'Xbar LCL',
    showlegend: false,
    line: {
      color: 'green',
      dash: 'dash',
      width: 1
    }
  } as any
  let Centre = {
    type: 'scatter',
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(mean.value),
    mode: 'lines',
    name: 'Centre',
    showlegend: false,
    line: {
      color: 'grey',
      width: 2
    }
  } as any
  let data = [Data1,xBarUCLTrace,xBarLCLTrace,Centre]
  const chartWindow = 150
  const start = lineStore.xData[lineStore.xData.length - chartWindow]
  const end = lineStore.xData[lineStore.xData.length - 1]
  let layout: any = {
    autosize: true,
    legend: {
      x: 1.015,
      y: 1.1,
      traceorder: 'normal',
      font: {
        family: 'Arial',
        size: 0.05
      }
    },
    title: {
      text:'Xbar Chart',
      yanchor: 'middle'
    },
    xaxis: {
      zeroline: false,
      range: [start, end]
    },
    yaxis: {
      autorange: true,
      zeroline: false
    },
    paper_bgcolor:'lightblue',
    plot_bgcolor:'white',
    margin: {"t": 25, "b": 20, "l": 20, "r": 90},
    font:{
      size:12,
      color:'dark'
    },
    annotations: [
      {
        text: `
子组容量：${sampleSize}<br>
均值：${mean.value}<br>
SD(组内): ${sigma_group.value}<br>
SD(全体): ${sigma_overall.value}<br>
Pp: ${pp.value}<br>
Cp: ${cp.value}<br>
Ppk: ${ppk.value}<br>
Cpk: ${cpk.value}
        `,
        x: 1.00,
        y: 1.00,
        xref: 'paper',
        yref: 'paper',
        xanchor: 'left',
        showarrow: false,
        align: 'left',
        font: {
          family: 'Arial',
          size: 0.05,
          color: 'dark'
        },
        bgcolor: 'lightBlue',
        opacity: 1
      }
    ]
  }
  Plotly.react(xBar.value, data, layout, { responsive: true })

  const selectPoints = (array: number[]) => {
    lineStore.cleanxbarOutliers()
    lineStore.selectedRules.forEach(check => {
      switch(check) {
        case 'isOutsideControlLimits':
          const result_1 = isOutsideControlLimits(array, upperLimit.value, lowerLimit.value)
          if (result_1.isOutside) {
            result_1.outsidePoints.forEach((point: { x: number; y: number; message: string; }) =>
              lineStore.xbarOutliers.push(point)
            )}
          break
        case 'isConsecutivePointsSameSide':
          const result_2 = isConsecutivePointsSameSide(array,mean.value)
          if (result_2.sameSide) {
            result_2.segments.forEach(segment => {
              segment.forEach(point=> {
                lineStore.xbarOutliers.push(point)
              })
            })
          }
          break
        case 'isConsecutiveIncreasingOrDecreasingPoints':
          const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array)
          if (result_3.increasingOrDecreasing) {
            result_3.segments.forEach(segment => {
              segment.forEach(point=> {
                lineStore.xbarOutliers.push(point)
              })
            })
          }
          break
        case 'isAlternatingPoints':
          const result_4 = isAlternatingPoints(array)
          if (result_4.alternating) {
            result_4.segments.forEach(segment => {
              segment.forEach(point=> {
                lineStore.xbarOutliers.push(point)
              })
            })
          }
          break
        case 'isOutsideControlZoneB':
          const result_5 = isOutsideControlZoneB(array, mean.value, sigma_group.value)
          if (result_5.outsideZoneB) {
            result_5.segments.forEach(point => {
              lineStore.xbarOutliers.push(point)
            })
          }
          break
        case 'isOutsideControlZoneC':
          const result_6 = isOutsideControlZoneC(array, mean.value, sigma_group.value)
          if (result_6.outsideZoneC) {
            result_6.segments.forEach(point => {
              lineStore.xbarOutliers.push(point)
            })
          }
          break
        case 'isInsideControlZoneC':
          const result_7 = isInsideControlZoneC(array, mean.value, sigma_group.value)
          if (result_7.insideZoneC) {
            result_7.segments.forEach(point => {
              lineStore.xbarOutliers.push(point)
            })
          }
          break
        case 'isOutsideControlZoneCandBothSides':
          const result_8 = isOutsideControlZoneCandBothSides(array, mean.value, sigma_group.value)
          if (result_8.outsideZoneC) {
            result_8.segments.forEach(point => {
              lineStore.xbarOutliers.push(point)
            })
          }
          break
        }
    })
  }
  selectPoints(lineStore.xBarMean.yMeans)
  const pointMessages = new Map<string, string[]>()
  function addPoint(point: Outlier): void {
    const key = `${point.x}_${point.y}`
    if (pointMessages.has(key)) {
      pointMessages.get(key)?.push(point.message);
    } else {
      pointMessages.set(key, [point.message]);
    }
  }
  for(const point of lineStore.xbarOutliers) {
    addPoint(point)
  }
  const hovertext = lineStore.xbarOutliers.map((point) => {
    const key = `${point.x}_${point.y}`
    return pointMessages.get(key)?.join('<br>') || ''
  })
  const outlierTrace = {
    x: lineStore.xbarOutliers.map(outlier => outlier.x),
    y: lineStore.xbarOutliers.map(outlier => outlier.y),
    mode: 'markers+text',
    hovertext,
    name: 'Outliers',
    showlegend: false,
    marker: {
      color: 'red',
      size: 8,
      symbol: 'cross'
    }
  }
  Plotly.addTraces(xBar.value, [outlierTrace])
}
function handleResize() {
  if (Plotly) {
    Plotly.Plots.resize(xBar.value)
  }
}
onMounted(async ()=>{
  lineStore.loadData(true).then(async ()=> {
    await renderChart()
  })
  watch(
    ()=> [ lineStore.yData, mainStore.isCollapse],
    async (newValues,oldValues)=> {
      if(newValues[0] !== oldValues[0]) {
        await renderChart()
      }
      if(newValues[1] !== oldValues[1]) {
        nextTick(() => {
          handleResize()
        })
      }
    }
  )

  // 监听AI面板动画完成事件
  window.addEventListener('aiPanelTransitionEnd', handleResize);
})

// 组件卸载前清理事件监听器
onUnmounted(() => {
  window.removeEventListener('aiPanelTransitionEnd', handleResize);
});

</script>
<template>
   <div class="chart-container">
     <div ref="xBar" class="chart x-bar">
     </div>
   </div>
</template>
<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
}

.chart {
  flex: 1;
  width: 100%;
  height: 100%;
}

.x-bar {
  .button {
    display: flex;
  }
}
</style>
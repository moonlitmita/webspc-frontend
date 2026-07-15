/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="r-chart-container">
    <div ref="rChart" class="chart"></div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onBeforeUnmount, watch, ref, nextTick } from 'vue'
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { useLineStore } from '../../../store/lineData'
import { useMainStore } from '../../../store'
import { getD3, getD4 } from '../../../utils/statistics'
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints,
 } from '../../../utils/rules'
import { buildOutlierHovertext } from '../../../utils/outlierHover'

const lineStore = useLineStore()
const mainStore = useMainStore()
const rChart = ref()
let Plotly: PlotlyType | null = null
const renderChart = async () => {
  // Load Plotly if not already loaded
  if (!Plotly) {
    Plotly = await loadPlotly();
  }

const sampleSize = lineStore.sampleSize
const mean = lineStore.rBar.rBar
const upperLimit = getD4(sampleSize)*lineStore.rBar.rBar
const lowerLimit = getD3(sampleSize)*lineStore.rBar.rBar
lineStore.updaterCL(upperLimit, lowerLimit)
let Data1 = {
  type: 'scatter',
  x: lineStore.xData,
  y: lineStore.rBar.rValue,
  mode: 'lines+markers',
  name: 'Data',
  showlegend: true,
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
} as any
let rUCLTrace = {
  x: lineStore.xData,
  y: Array(lineStore.rBar.rValue.length).fill(upperLimit),
  mode: 'lines',
  name: 'R UCL',
  line: {
    color: 'green',
    dash: 'dash',
    width: 1
  }
} as any

let rLCLTrace = {
  x: lineStore.xData,
  y: Array(lineStore.rBar.rValue.length).fill(lowerLimit),
  mode: 'lines',
  name: 'R LCL',
  line: {
    color: 'green',
    dash: 'dash',
    width: 1
  }
} as any

let Centre = {
  type: 'scatter',
  x: lineStore.xData,
  y: Array(lineStore.rBar.rValue.length).fill(lineStore.rBar.rBar),
  mode: 'lines',
  name: 'Centre',
  showlegend: true,
  line: {
    color: 'grey',
    dash: 'dash',
    width: 1
  }
} as any

let data = [Data1,rUCLTrace,rLCLTrace,Centre]
const chartWindow = 150
const start = lineStore.xData[lineStore.xData.length - chartWindow]
const end = lineStore.xData[lineStore.xData.length - 1]
let layout: any = {
  autosize: true,
  legend: {
    x: 1.0,
    y: 1.0,
    xanchor: 'left',
    traceorder: 'normal',
    font: {
      family: 'Arial',
      size: 0.05,
    }
  },
 title: {
   text: 'R Chart',
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
 margin: {"t": 25, "b": 20, "l": 20, "r": 0},
 font:{
   size:12,
   color:'dark'
 }
}
if (rChart.value && Plotly) {
  Plotly.react(rChart.value, data, layout, {responsive: true})
}

const selectPoints = (array: number[]) => {
  lineStore.cleanrOutliers()
  const result_1 = isOutsideControlLimits(array, upperLimit, lowerLimit, lineStore.date)
  if (result_1.isOutside) {
    result_1.outsidePoints.forEach(point => lineStore.rOutliers.push(point))
  }
  const result_2 = isConsecutivePointsSameSide(array, mean, lineStore.date)
  if (result_2.sameSide) {
    result_2.segments.forEach(segment => {
      segment.forEach(point=> {
        lineStore.rOutliers.push(point)
      })
    })
  }
 const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array, lineStore.date)
 if (result_3.increasingOrDecreasing) {
   result_3.segments.forEach(segment => {
     segment.forEach(point=> {
       lineStore.rOutliers.push(point)
     })
   })
 }
 const result_4 = isAlternatingPoints(array, lineStore.date)
 if (result_4.alternating) {
   result_4.segments.forEach(segment => {
     segment.forEach(point=> {
       lineStore.rOutliers.push(point)
     })
   })
 }
}
selectPoints(lineStore.rBar.rValue)

const hovertext = buildOutlierHovertext(lineStore.rOutliers)

const outlierTrace = {
  x: lineStore.rOutliers.map(outlier => outlier.x),
  y: lineStore.rOutliers.map(outlier => outlier.y),
  mode: 'markers+text',
  hovertext,
  name: 'Outliers',
  marker: {
    color: 'red',
    size: 8,
    symbol: 'cross'
  }
}
if (rChart.value && Plotly) {
  Plotly.addTraces(rChart.value, [outlierTrace]);
}
}
function handleResize() {
  if (Plotly && rChart.value) {
    Plotly.Plots.resize(rChart.value)
  }
}

// 组件卸载前的清理工作
onBeforeUnmount(() => {
  // 如果需要，可以在这里销毁plotly图表
  if (Plotly && rChart.value) {
    try {
      Plotly.purge(rChart.value); // 清理plotly图表
    } catch (e) {
      console.warn('Error while purging plotly chart:', e);
    }
  }
  // 清理自定义事件监听器
  window.removeEventListener('aiPanelTransitionEnd', handleResize);
});

onMounted(async ()=>{
  const getAll = true
  lineStore.loadData(getAll).then(async ()=> {
    await renderChart()
  })
  watch(
    ()=> [ lineStore.rBar.rValue, mainStore.isCollapse ],
    async (newValues,oldValues)=> {
      if(newValues[0] !== oldValues[0]) {
        if (rChart.value) {  // 确保DOM元素存在
          await renderChart()
        }
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

</script>
<style scoped>
.r-chart-container {
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
</style>
/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="mr-chart-container">
    <div ref="mrChart" class="chart"></div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick} from 'vue'
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { useLineStore } from '../../../store/lineData'
import type { Outlier } from '../../../store/lineData'
import { useMainStore } from '../../../store'
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints,
} from '../../../utils/rules'
import { getD4, getD3 } from '../../../utils/statistics'

const lineStore = useLineStore()
const mainStore = useMainStore()

const upperLimit = ref(0)
const lowerLimit = ref(0)
const mrChart = ref()
let Plotly: PlotlyType | null = null

const renderChart = async () => {
  // Load Plotly if not already loaded
  if (!Plotly) {
    Plotly = await loadPlotly();
  }

  upperLimit.value = getD4(2)*lineStore.mrData.mrBar
  lowerLimit.value = getD3(2)*lineStore.mrData.mrBar
  lineStore.updatemrCL(upperLimit.value, lowerLimit.value)
  const mean = lineStore.mrData.mrBar
  let Data1 = {
    type: 'scatter',
    x: lineStore.xData,
    y: lineStore.mrData.movingRanges,
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
  let mrUCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(upperLimit.value),
    mode: 'lines',
    name: 'MR UCL',
    line: {
      color: 'green',
      dash: 'dash',
      width: 1
    }
  } as any

  let mrLCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(lowerLimit.value),
    mode: 'lines',
    name: 'MR LCL',
    line: {
      color: 'green',
      dash: 'dash',
      width: 1
    }
  } as any
  let Centre = {
    type: 'scatter',
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(mean),
    mode: 'lines',
    name: 'Centre',
    showlegend: true,
    line: {
      color: 'grey',
      dash: 'dash',
      width: 1
    }
  } as any
  let data = [Data1,mrUCLTrace,mrLCLTrace,Centre]
  const chartWindow = 150
  const start = lineStore.xData[lineStore.xData.length - chartWindow]
  const end = lineStore.xData[lineStore.xData.length - 1]
  let layout: any = {
    autosize: true,
    legend: {
      x: 1.00,
      y: 1.00,
      xanchor: 'left',
      traceorder: 'normal',
      font: {
        family: 'Arial',
        size: 0.05,
      }
    },
    title: {
      text: 'MR Chart',
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
  if (mrChart.value && Plotly) {
    Plotly.react(mrChart.value, data, layout, {responsive: true});
  }

  const selectPoints = (array: number[]) => {
    lineStore.cleanmrOutliers()
    const result_1 = isOutsideControlLimits(array, upperLimit.value, lowerLimit.value)
    if (result_1.isOutside) {
      result_1.outsidePoints.forEach((point: { x: number; y: number; message: string; }) => lineStore.mrOutliers.push(point)
      )
    }
    const result_2 = isConsecutivePointsSameSide(array,mean)
    if (result_2.sameSide) {
      result_2.segments.forEach(segment => {
        segment.forEach(point=> {
          lineStore.mrOutliers.push(point)
        })
      })
    }
    const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array)
    if (result_3.increasingOrDecreasing) {
      result_3.segments.forEach(segment => {
        segment.forEach(point=> {
          lineStore.mrOutliers.push(point)
        })
      })
    }
    const result_4 = isAlternatingPoints(array)
    if (result_4.alternating) {
      result_4.segments.forEach(segment => {
        segment.forEach(point=> {
          lineStore.mrOutliers.push(point)
        })
      })
    }
  }
  selectPoints(lineStore.mrData.movingRanges)
  const pointMessages = new Map<string, string[]>()
  function addPoint(point: Outlier): void {
    const key = `${point.x}_${point.y}`;
    if (pointMessages.has(key)) {
      pointMessages.get(key)?.push(point.message);
    } else {
      pointMessages.set(key, [point.message]);
    }
  }
  for(const point of lineStore.mrOutliers) {
    addPoint(point)
  }
  const hovertext = lineStore.mrOutliers.map((point) => {
    const key = `${point.x}_${point.y}`
    return pointMessages.get(key)?.join('<br>') || ''
  })
  const outlierTrace = {
    x: lineStore.mrOutliers.map(outlier => outlier.x),
    y: lineStore.mrOutliers.map(outlier => outlier.y),
    mode: 'markers+text',
    hovertext,
    name: 'Outliers',
    marker: {
      color: 'red',
      size: 8,
      symbol: 'cross'
    }
  }
  if (mrChart.value && Plotly) {
    Plotly.addTraces(mrChart.value, [outlierTrace]);
  }
}
function handleResize() {
  if (Plotly && mrChart.value) {
    Plotly.Plots.resize(mrChart.value)
  }
}

// 组件卸载前的清理工作
onBeforeUnmount(() => {
  // 如果需要，可以在这里销毁plotly图表
  if (Plotly && mrChart.value) {
    try {
      Plotly.purge(mrChart.value); // 清理plotly图表
    } catch (e) {
      console.warn('Error while purging plotly chart:', e);
    }
  }
});

onMounted(async ()=> {
  const getAll = true
  lineStore.loadData(getAll).then(async ()=> {
    await renderChart()
  })
  watch(
    ()=> [lineStore.mrData.movingRanges, mainStore.isCollapse],
    async (newValues,oldValues)=> {
      if(newValues[0] !== oldValues[0]) {
        if (mrChart.value) {  // 确保DOM元素存在
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

// 组件卸载前清理事件监听器
onUnmounted(() => {
  window.removeEventListener('aiPanelTransitionEnd', handleResize);
});

</script>
<style scoped>
.mr-chart-container {
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
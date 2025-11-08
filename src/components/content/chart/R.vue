/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div ref="rChart">
  </div>
</template>
<script lang="ts" setup>
import { onMounted, watch, ref } from 'vue'
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { useLineStore } from '../../../store/lineData'
import type { Outlier } from '../../../store/lineData'
import { useMainStore } from '../../../store'
import { getD3, getD4 } from '../../../utils/statistics'
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints, 
 } from '../../../utils/rules'

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
   range: [0, 151]
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
Plotly.newPlot(rChart.value, data, layout, {responsive: true})

const selectPoints = (array: number[]) => {
  lineStore.cleanrOutliers()
  const result_1 = isOutsideControlLimits(array,upperLimit,lowerLimit)
  if (result_1.isOutside) {
    result_1.outsidePoints.forEach((point: { x: number; y: number; message: string; }) => 
      lineStore.rOutliers.push(point)
    )
  }
  const result_2 = isConsecutivePointsSameSide(array, mean)
  if (result_2.sameSide) {
    result_2.segments.forEach(segment => {
      segment.forEach(point=> {
        lineStore.rOutliers.push(point)
      })
    })
  }
 const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array)
 if (result_3.increasingOrDecreasing) {
   result_3.segments.forEach(segment => {
     segment.forEach(point=> {
       lineStore.rOutliers.push(point)
     })
   })
 }
 const result_4 = isAlternatingPoints(array)
 if (result_4.alternating) {
   result_4.segments.forEach(segment => {
     segment.forEach(point=> {
       lineStore.rOutliers.push(point)
     })
   })
 }
}
selectPoints(lineStore.rBar.rValue)
const pointMessages = new Map<string, string[]>()
function addPoint(point: Outlier): void {
  const key = `${point.x}_${point.y}`
  if (pointMessages.has(key)) {
    pointMessages.get(key)?.push(point.message)
  } else {
    pointMessages.set(key, [point.message]);
 }
}
for(const point of lineStore.rOutliers) {
  addPoint(point)
}
const hovertext = lineStore.rOutliers.map((point) => {
  const key = `${point.x}_${point.y}`
  return pointMessages.get(key)?.join('<br>') || ''
})
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
Plotly.addTraces(rChart.value, [outlierTrace]);
}
function handleResize() {
  if (Plotly) {
    Plotly.Plots.resize(rChart.value)
  }
}
onMounted(async ()=>{
  const getAll = true
  lineStore.loadData(getAll).then(async ()=> {
    await renderChart()
  })
  watch(
    ()=> [ lineStore.rBar.rValue, mainStore.isCollapse, mainStore.aiVisible ],
    async (newValues,oldValues)=> {
      if(newValues[0] !== oldValues[0]) {
        await renderChart()
      }
      if(newValues[1] !== oldValues[1]) {
        handleResize()
      }
      if(newValues[2] !== oldValues[2]) {
        handleResize()
      }
    }
  )
})

</script>
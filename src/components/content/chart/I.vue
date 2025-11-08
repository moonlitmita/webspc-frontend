/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<script lang='ts' setup>
import { onMounted, watch, ref} from 'vue'
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { useLineStore } from '../../../store/lineData'
import type { Outlier }  from '../../../store/lineData'
import { useMainStore } from '../../../store'
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints,
  isOutsideControlZoneB, isOutsideControlZoneC, isInsideControlZoneC, isOutsideControlZoneCandBothSides
} from '../../../utils/rules'
import { calculateSampleStandardDeviation, cp_pp, cpk_ppk, getD2 } from '../../../utils/statistics'

const lineStore = useLineStore()
const mainStore = useMainStore()

const sampleSize = lineStore.sampleSize
const iChart = ref()
let Plotly: PlotlyType | null = null
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
const updateDynamicLimits= ()=> {
  mean.value = Number(lineStore.xBarMean.xBarMean.toFixed(2))
  sigma_group.value = ((lineStore.mrData.mrBar)/getD2(2)).toFixed(2)
  sigma_overall.value = calculateSampleStandardDeviation(lineStore.yData.flat(), mean.value).toFixed(2)
  upperLimit.value = mean.value + 3*sigma_group.value  
  lowerLimit.value = mean.value - 3*sigma_group.value 
  lineStore.updateiCL(upperLimit.value, lowerLimit.value)
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
  } as any
  let xBarUCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(upperLimit.value),
    mode: 'lines',
    name: "",
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
    name: "",
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
    name: "",
    showlegend: false,
    line: {
      color: 'grey',
      width: 2
    }
  } as any

  let data = [Data1,xBarUCLTrace,xBarLCLTrace,Centre]
  let layout: any = {
    showlegend: false,
    autosize: true,
    legend: {
      x: 1.015,
      y: 1.10,
      xanchor: 'left',
      traceorder: 'normal',
      font: {
        family: 'Arial',
        size: 0.05,
      }
    },
    title: {
      text: 'I Chart',
      yanchor: 'middle'
    },
    xaxis: {
      zeroline: false,
      range: [0,151]
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
  Plotly.newPlot(iChart.value, data, layout, {responsive: true});

  const selectPoints = (array: number[]) => {
    // 清空之前的异常点
    lineStore.cleaniOutliers()
    lineStore.selectedRules.forEach(check => {
      switch(check) {
        case 'isOutsideControlLimits':
          const result_1 = isOutsideControlLimits(array, upperLimit.value, lowerLimit.value)
          if (result_1.isOutside) {
            result_1.outsidePoints.forEach((point: { x: number; y: number; message: string; }) => lineStore.iOutliers.push(point)
          )}
          break
        case 'isConsecutivePointsSameSide':
          const result_2 = isConsecutivePointsSameSide(array,mean.value)
          if (result_2.sameSide) {
            result_2.segments.forEach(segment => {
              segment.forEach(point=> {
                lineStore.iOutliers.push(point)
              })
            })
          }
          break
        case 'isConsecutiveIncreasingOrDecreasingPoints':
          const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array)
          if (result_3.increasingOrDecreasing) {
            result_3.segments.forEach(segment => {
              segment.forEach(point=> {
                lineStore.iOutliers.push(point)
              })
            })
          }
          break
        case 'isAlternatingPoints':
          const result_4 = isAlternatingPoints(array)
          if (result_4.alternating) {
            result_4.segments.forEach(segment => {
              segment.forEach(point=> {
                lineStore.iOutliers.push(point)
              })
            })
          }
          break
        case 'isOutsideControlZoneB':
          const result_5 = isOutsideControlZoneB(array, mean.value, sigma_group.value)
          if (result_5.outsideZoneB) {
            result_5.segments.forEach(point => {
              lineStore.iOutliers.push(point)
            })
          }
          break
        case 'isOutsideControlZoneC':
          const result_6 = isOutsideControlZoneC(array, mean.value, sigma_group.value)
          if (result_6.outsideZoneC) {
            result_6.segments.forEach(point => {
              lineStore.iOutliers.push(point)
            })
          }
          break
        case 'isInsideControlZoneC':
          const result_7 = isInsideControlZoneC(array, mean.value, sigma_group.value)
          if (result_7.insideZoneC) {
            result_7.segments.forEach(point => {
              lineStore.iOutliers.push(point)
            })
          }
          break
        case 'isOutsideControlZoneCandBothSides':
          const result_8 = isOutsideControlZoneCandBothSides(array, mean.value, sigma_group.value)
          if (result_8.outsideZoneC) {
            result_8.segments.forEach(point => {
              lineStore.iOutliers.push(point)
            })
          }
          break
        }
      })
  }

  selectPoints(lineStore.xBarMean.yMeans)
  const pointMessages = new Map<string, string[]>()
  function addPoint(point: Outlier): void {
    const key = `${point.x}_${point.y}`;
    if (pointMessages.has(key)) {
      pointMessages.get(key)?.push(point.message)
    } else {
      pointMessages.set(key, [point.message])
    }
  }
  for(const point of lineStore.iOutliers) {
    addPoint(point)
  }
  const hovertext = lineStore.iOutliers.map((point) => {
    const key = `${point.x}_${point.y}`
    return pointMessages.get(key)?.join('<br>') || ''
  })
  const outlierTrace = {
    x: lineStore.iOutliers.map(outlier => outlier.x),
    y: lineStore.iOutliers.map(outlier => outlier.y),
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
  Plotly.addTraces(iChart.value, [outlierTrace]);
}
function handleResize() {
  if (Plotly) {
    Plotly.Plots.resize(iChart.value)
  }
}
onMounted(async ()=> {
  const getAll = true
  lineStore.loadData(getAll).then(async ()=> {
    await renderChart()
  })
  watch(
    ()=> [lineStore.xBarMean.yMeans, mainStore.isCollapse, mainStore.aiVisible],
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
<template>
  <div ref="iChart">
  </div>
</template>

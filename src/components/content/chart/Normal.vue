/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<script lang="ts" setup>
import Plotly from 'plotly.js-dist-min'
import { onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useLineStore } from '../../../store/lineData'
import { getD2 } from '../../../utils/statistics'

const lineStore = useLineStore()
const normal = ref()
const n = Number(lineStore.sampleSize)
const result = Math.sqrt(n)
const yMeans = ref([0])
const mean = ref(0)
const sigma = ref(0)
const upperLimit = ref(0)
const lowerLimit  = ref(0)
const testName = ref('')
const pValue: Ref<string | null> = ref(null)
const tolerance = ref(0)

const updateDynamicLimits= ()=> {
  yMeans.value = lineStore.xBarMean.yMeans
  mean.value = lineStore.xBarMean.xBarMean
  sigma.value = (n===1) ? lineStore.mrData.mrBar/getD2(2) : (1/result)*(lineStore.rBar.rBar/getD2(n))
  upperLimit.value = mean.value + 3*sigma.value  
  lowerLimit.value = mean.value - 3*sigma.value  
  testName.value = lineStore.testName
  pValue.value = lineStore.pValue
  tolerance.value = lineStore.USL - lineStore.LSL
}

function calculateHistogramData(data: number[], binCount: number): { x: number[]; y: number[] } {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const step = (max - min) / binCount
  const x: number[] = []
  const y: number[] = []
  for (let i = 0; i < binCount; i++) {
    const start = min + step * i
    const end = min + step * (i + 1)
    const count = data.filter((value) => value >= start && value < end).length
    x.push((start + end) / 2)
    y.push(count)
  }
  return { x, y }
}

function calculatePDFData(data: number[], mean: number, stdDev: number): { x: number[]; y: number[] } {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const step = tolerance.value/50
  const x: number[] = []
  const y: number[] = []
  for (let i = min; i <= max; i += step) {
    x.push(i);
    const pdf = Math.exp(-Math.pow((i - mean) / stdDev, 2) / 2) / (stdDev * Math.sqrt(2 * Math.PI));
    y.push(pdf);
  }
  return { x, y };
}
function normalize(data: number[]): number[] {
  const maxVal = Math.max(...data);
  return data.map(val => val / maxVal);
}

const renderChart = ()=> {
  updateDynamicLimits()
  const binCount = 10
  const histogramData = calculateHistogramData(yMeans.value, binCount)
  const pdfData = calculatePDFData(yMeans.value, mean.value, sigma.value)
  const histogramTrace: Partial<Plotly.PlotData>[] = [
    {
      type: 'bar',
      x: histogramData.x,
      y: histogramData.y,
      marker: {
        color: 'steelblue',
      },
      yaxis: 'y',
      showlegend: false
    },
  ]
  const pdfTrace: Partial<Plotly.PlotData>[] = [
    {
      type: 'scatter',
      x: pdfData.x,
      y: normalize(pdfData.y),
      mode: 'lines',
      line: {
        color: 'red',
      },
      yaxis: 'y2',
      showlegend: false
    },
  ]
  const graphData = [...histogramTrace, ...pdfTrace]
  const layout: Partial<Plotly.Layout> = {
    title: {
      text:'数据分布图',
      yanchor: 'middle'
    },
    xaxis: {
      title: '观测值' as Partial<Plotly.Layout>,
    },
    yaxis: {
      title: '频数' as Partial<Plotly.Layout>,
      range: [0, 30],
      side: 'left'
    },
    yaxis2: {
      title: '概率密度' as Partial<Plotly.Layout>,
      range: [0, 1], 
      overlaying: 'y',
      side: 'right',
      showgrid: false,  
      zeroline: false,  
    },
    height: 220,
    width: 500,
    margin: {"t": 25, "b": 30, "l": 35, "r": 35},
    annotations: [
      {
        text:`
        正态检验方法： ${testName.value}<br>
        p-value: ${pValue.value}
        `,
        x: 0.95,
        y: 0.95,
        xref: 'paper',
        yref: 'paper',
        xanchor: 'right',
        yanchor: 'top',
        showarrow: false,
        align: 'left',
        font: {
          family: 'Arial',
          size: 0.05,
          color: 'dark'
        },
        opacity: 1
      }
    ]
  }
  const config = { responsive: true }
  Plotly.newPlot(normal.value, graphData, layout,config)
}

onMounted(()=> {
  lineStore.loadData(true).then(()=> {
    renderChart()
  })
  watch(()=> lineStore.xBarMean.yMeans,
    (newvalues, oldValues)=> {
      if(newvalues !== oldValues) {
        renderChart()
      }
    }
  )
})

</script>
<template>
    <div ref="normal"></div>
</template>



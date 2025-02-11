/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div ref="mrChart"></div>
</template>
<script lang="ts" setup>
import { onMounted, watch, ref} from 'vue';
import Plotly from 'plotly.js-dist-min'
import { useLineStore } from '../../../store/lineData';
import { useMainStore } from '../../../store';
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints,
} from '../../../utils/rules'

const lineStore = useLineStore()
const mainStore = useMainStore()

const mrChart = ref()
const renderChart = () => {
  const upperLimit = lineStore.mrUCL
  const lowerLimit = lineStore.mrLCL
  const mean = lineStore.mrData.mrBar
  let Data1 = {
    type: 'scatter',
    x: lineStore.xData,
    y: lineStore.mrData.movingRanges,
    mode: 'lines+markers',
    name: 'Data',
    showlegend: true,
    hoverinfo: 'all',
    line: {
      color: 'blue',
      width: 2
    },
    marker: {
      color: 'blue',
      size: 8,
      symbol: 'circle'
    }
  } as Plotly.Data
  let mrUCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(upperLimit),
    mode: 'lines',
    name: 'MR UCL',
    line: {
      color: 'green',
      dash: 'dash',
      width: 1
    }
  } as Plotly.Data 
  let mrLCLTrace = {
    x: lineStore.xData,
    y: Array(lineStore.yData.length).fill(lowerLimit),
    mode: 'lines',
    name: 'MR LCL',
    line: {
      color: 'green',
      dash: 'dash',
      width: 1
    }
  } as Plotly.Data
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
  } as Plotly.Data
  let data = [Data1,mrUCLTrace,mrLCLTrace,Centre]
  let layout: Partial<Plotly.Layout>= {
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
  Plotly.newPlot(mrChart.value, data, layout, {responsive: true});
  
  type Outlier = {
    x: number;
    y: number;
    message: string;
  };
  
  const outliers: Outlier[] = []
  const selectPoints = (array: number[]) => {
    const result_1 = isOutsideControlLimits(array, upperLimit, lowerLimit)
    if (result_1.isOutside) {
      result_1.outsidePoints.forEach((point: { x: number; y: number; message: string; }) => outliers.push(point)
      )
    }
    const result_2 = isConsecutivePointsSameSide(array,mean)
    if (result_2.sameSide) {
      result_2.segments.forEach(segment => {
        segment.forEach(point=> {
          outliers.push(point)
        })
      })
    }
    const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array)
    if (result_3.increasingOrDecreasing) {
      result_3.segments.forEach(segment => {
        segment.forEach(point=> {
          outliers.push(point)
        })
      })
    }
    const result_4 = isAlternatingPoints(array)
    if (result_4.alternating) {
      result_4.segments.forEach(segment => {
        segment.forEach(point=> {
          outliers.push(point)
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
  for(const point of outliers) {
    addPoint(point)
  }
  const hovertext = outliers.map((point) => {
    const key = `${point.x}_${point.y}`
    return pointMessages.get(key)?.join('<br>') || ''
  })
  const outlierTrace = {
    x: outliers.map(outlier => outlier.x),
    y: outliers.map(outlier => outlier.y),
    mode: 'markers+text',
    hovertext,
    name: 'Outliers',
    marker: {
      color: 'red',
      size: 8,
      symbol: 'cross'
    }
  }
  Plotly.addTraces(mrChart.value, [outlierTrace]);
}
function handleResize() {
  Plotly.Plots.resize(mrChart.value)
}
onMounted(()=>{
  const getAll = true
  lineStore.loadData(getAll).then(()=> {
    renderChart()
  })
  watch(
    ()=> [lineStore.mrData.movingRanges, mainStore.isCollapse],
    (newValues,oldValues)=> {
      if(newValues[0] !== oldValues[0]) {
        renderChart()
      }
      if(newValues[1] !== oldValues[1]) {
        handleResize()
      }
    }
  )
})

</script>
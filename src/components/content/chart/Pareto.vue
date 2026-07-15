/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<script lang="ts" setup>
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { onMounted, ref, watch } from 'vue'
import { useLineStore } from '../../../store/lineData'

const lineStore = useLineStore()
const pareto = ref()
let Plotly: PlotlyType | null = null

type DataItem = {
  category: string;
  value: number;
}

const renderChart = async ()=> {
  // Load Plotly if not already loaded
  if (!Plotly) {
    Plotly = await loadPlotly();
  }
  
  let data: DataItem[] = [{category: '组间方差分量',value: Number(lineStore.varianceBetween)}, {category: '组内方差分量',value: Number(lineStore.varianceWithin)}]
  const sortedData = data.sort((a, b) => b.value - a.value)
  const sum = data.reduce((accumulator, currentItem) => accumulator + currentItem.value, 0)
  let cumulativePercentage = 0;
  const cumulativePercentages: string[] = sortedData.map(item => {
    cumulativePercentage += (item.value / sum) * 100
    return cumulativePercentage.toFixed(2)
  })
  const barData: any = {
    x: sortedData.map(item => item.category),
    y: sortedData.map(item => item.value),
    type: 'bar',
    texttemplate: '%{y}',
    name: 'Values',
    showlegend: false
  } 
  const lineData: any = {
    x: sortedData.map(item => item.category),
    y: cumulativePercentages,
    type: 'scatter',
    yaxis: 'y2',
    name: 'Cumulative Percentage',
    showlegend: false
  }
  const layout: any = {
    title: {
      text: '变异组成帕累托图',
      yanchor:'middle',
    },
    xaxis: {
      title: '类别'
    },
    yaxis: {
      title: '观测值'
    },
    yaxis2: {
      title: '累积百分比(%)', 
      overlaying: 'y',
      side: 'right',
      showgrid: false,
      range: [0, 100]
    },
    barmode: 'group',
    bargap: 0,
    width: 300,
    height: 220,
    margin: {"t": 25, "b": 30, "l": 35, "r": 35},
  }
  const data1 = [barData, lineData]
  if(pareto.value && Plotly) {
    Plotly.newPlot(pareto.value, data1, layout, {responsive: true})
  }
}

onMounted(async ()=> {
  await renderChart()
  watch(()=>[lineStore.varianceBetween, lineStore.varianceWithin],
    async (newvalues, oldValues)=> {
      if(newvalues !== oldValues) {
        await renderChart()
      }
    }
  )
})

</script>
<template>
  <div ref="pareto">
  </div>
</template>
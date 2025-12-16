/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<script lang='ts' setup>
import { onMounted, onBeforeUnmount, onUnmounted, watch, ref, nextTick} from 'vue'
import { loadPlotly, type PlotlyType } from '../../../utils/plotlyLoader'
import { useLineStore } from '../../../store/lineData'
import type { Outlier }  from '../../../store/lineData'
import { useMainStore } from '../../../store'
import { storeToRefs } from 'pinia'
import { isOutsideControlLimits, isConsecutivePointsSameSide, isConsecutiveIncreasingOrDecreasingPoints, isAlternatingPoints,
  isOutsideControlZoneB, isOutsideControlZoneC, isInsideControlZoneC, isOutsideControlZoneCandBothSides
} from '../../../utils/rules'
import { calculateSampleStandardDeviation, cp_pp, cpk_ppk, getD2 } from '../../../utils/statistics'

const lineStore = useLineStore()
const mainStore = useMainStore()

const sampleSize = lineStore.sampleSize
const iChart = ref()
let Plotly: PlotlyType | null = null
const { isRealTimeMode } = storeToRefs(mainStore)
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

  const chartWindow = 150
  const start = lineStore.xData[lineStore.xData.length - chartWindow]
  const end = lineStore.xData[lineStore.xData.length - 1]
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
      // range: [0,151]
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
  if (Plotly && iChart.value) {
    Plotly.react(iChart.value, data, layout, {responsive: true});
  }

  // let newX = 0
  // function startStream() {
  //   setInterval(() => {
  //     const newX = lineStore.xData
  //     const newScatter = lineStore.xBarMean.yMeans
  //     const newUCL = Array(lineStore.yData.length).fill(upperLimit.value)
  //     const newLCL = Array(lineStore.yData.length).fill(lowerLimit.value)
  //     const newCentre = Array(lineStore.yData.length).fill(mean.value)
      
  //     Plotly.extendTraces(
  //       iChart.value,
  //       {x: [[newX]], y: [[newScatter], [newUCL], [newLCL], [newCentre]]}
  //     )
      
  //   }, 200);
  // }
  // startStream()

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
  // Add the outlier trace and ensure it has the correct index (4 in this case)
  if (Plotly && iChart.value) {
    Plotly.addTraces(iChart.value, [outlierTrace]);
  }
}

//由于直接使用定时器闪更数据即可实现实时数据流，以下使用extendTraces的方案暂时不用。
// let updateInterval: number | null = null;

// let lastProcessedIdx = -1; // 模块级
// const startRealTimeUpdates = () => {
//   if (updateInterval) {
//     clearInterval(updateInterval);
//   }

//   updateInterval = window.setInterval(() => {
//     // lineStore.loadData(true)
//     const currLen = lineStore.xBarMean.yMeans.length
//     if (currLen === 0 || currLen - 1 === lastProcessedIdx) return

//     const lastIdx = currLen - 1
//     const newX = [lineStore.xData[lastIdx]]
//     const newY = [lineStore.xBarMean.yMeans[lastIdx]]
//     // Get the latest data point
//     // const lastIndex = lineStore.xBarMean.yMeans.length - 1;
//     // const newX = [lineStore.xData[lastIndex]];
//     // const newY = [lineStore.xBarMean.yMeans[lastIndex]];
//     const newUCL = [upperLimit.value]
//     const newLCL = [lowerLimit.value]
//     const newCentre = [mean.value]

//     // Update data traces
//     if (Plotly) {
//       Plotly.extendTraces(
//         iChart.value,
//         {
//           x: [[newX[0]], [newX[0]], [newX[0]], [newX[0]]],
//           y: [[newY[0]], [newUCL[0]], [newLCL[0]], [newCentre[0]]]
//         },
//         [0, 1, 2, 3], // trace indices for data, UCL, LCL, center
//         150 // max number of points to keep
//       );
//     }
//     // Update outlier detection for the full dataset
//     updateAllOutliers(lineStore.xBarMean.yMeans);
//     lastProcessedIdx = lastIdx; // 更新游标
//   }, 1000); // Update every second
// };

// const stopRealTimeUpdates = () => {
//   if (updateInterval) {
//     clearInterval(updateInterval);
//     updateInterval = null;
//   }
// };

// const updateAllOutliers = (array: number[]) => {
//   // Implementation for updating outliers for the full dataset
//   // Clear the outlier trace first
//   if (Plotly) {
//     Plotly.deleteTraces(iChart.value, 4); // Assuming outlier trace is at index 4
//   }

//   // Find outliers in the current data
//   lineStore.cleaniOutliers();
//   lineStore.selectedRules.forEach(check => {
//     switch(check) {
//       case 'isOutsideControlLimits':
//         const result_1 = isOutsideControlLimits(array, upperLimit.value, lowerLimit.value);
//         if (result_1.isOutside) {
//           result_1.outsidePoints.forEach((point: { x: number; y: number; message: string; }) =>
//             lineStore.iOutliers.push(point));
//         }
//         break;
//       case 'isConsecutivePointsSameSide':
//         const result_2 = isConsecutivePointsSameSide(array, mean.value);
//         if (result_2.sameSide) {
//           result_2.segments.forEach(segment => {
//             segment.forEach(point=> {
//               lineStore.iOutliers.push(point);
//             });
//           });
//         }
//         break;
//       case 'isConsecutiveIncreasingOrDecreasingPoints':
//         const result_3 = isConsecutiveIncreasingOrDecreasingPoints(array);
//         if (result_3.increasingOrDecreasing) {
//           result_3.segments.forEach(segment => {
//             segment.forEach(point=> {
//               lineStore.iOutliers.push(point);
//             });
//           });
//         }
//         break;
//       case 'isAlternatingPoints':
//         const result_4 = isAlternatingPoints(array);
//         if (result_4.alternating) {
//           result_4.segments.forEach(segment => {
//             segment.forEach(point=> {
//               lineStore.iOutliers.push(point);
//             });
//           });
//         }
//         break;
//       case 'isOutsideControlZoneB':
//         const result_5 = isOutsideControlZoneB(array, mean.value, sigma_group.value);
//         if (result_5.outsideZoneB) {
//           result_5.segments.forEach(point => {
//             lineStore.iOutliers.push(point);
//           });
//         }
//         break;
//       case 'isOutsideControlZoneC':
//         const result_6 = isOutsideControlZoneC(array, mean.value, sigma_group.value);
//         if (result_6.outsideZoneC) {
//           result_6.segments.forEach(point => {
//             lineStore.iOutliers.push(point);
//           });
//         }
//         break;
//       case 'isInsideControlZoneC':
//         const result_7 = isInsideControlZoneC(array, mean.value, sigma_group.value);
//         if (result_7.insideZoneC) {
//           result_7.segments.forEach(point => {
//             lineStore.iOutliers.push(point);
//           });
//         }
//         break;
//       case 'isOutsideControlZoneCandBothSides':
//         const result_8 = isOutsideControlZoneCandBothSides(array, mean.value, sigma_group.value);
//         if (result_8.outsideZoneC) {
//           result_8.segments.forEach(point => {
//             lineStore.iOutliers.push(point);
//           });
//         }
//         break;
//     }
//   });

//   // Create new outlier trace
//   const pointMessages = new Map<string, string[]>();
//   function addPoint(point: Outlier): void {
//     const key = `${point.x}_${point.y}`;
//     if (pointMessages.has(key)) {
//       pointMessages.get(key)?.push(point.message);
//     } else {
//       pointMessages.set(key, [point.message]);
//     }
//   }
//   for(const point of lineStore.iOutliers) {
//     addPoint(point);
//   }
//   const hovertext = lineStore.iOutliers.map((point) => {
//     const key = `${point.x}_${point.y}`;
//     return pointMessages.get(key)?.join('<br>') || '';
//   });
//   const outlierTrace = {
//     x: lineStore.iOutliers.map(outlier => outlier.x),
//     y: lineStore.iOutliers.map(outlier => outlier.y),
//     mode: 'markers+text',
//     hovertext,
//     name: 'Outliers',
//     showlegend: false,
//     marker: {
//       color: 'red',
//       size: 8,
//       symbol: 'cross'
//     }
//   };

//   // Add the updated outlier trace
//   if (Plotly) {
//     Plotly.addTraces(iChart.value, [outlierTrace]);
//   }

//   // Auto-scroll to show latest data when exceeding 150 points
//   if (lineStore.xData.length > 150) {
//     const start = lineStore.xData[lineStore.xData.length - 150];
//     const end = lineStore.xData[lineStore.xData.length - 1];

//     if (Plotly) {
//       Plotly.relayout(iChart.value, {
//         'xaxis.range[0]': start,
//         'xaxis.range[1]': end
//       });
//     }
//   }
// };

// const toggleRealTimeMode = () => {
//   // This method is no longer used since we control real-time mode via the store
//   // But we keep it here for potential future use
//   mainStore.toggleRealTimeMode();
// };

// function handleResize() {
//   if (Plotly && iChart.value) {
//     Plotly.Plots.resize(iChart.value);
//   }
// }

function handleResize() {
  if (Plotly) {
    Plotly.Plots.resize(iChart.value);
  }
}

// 组件卸载前的清理工作
onBeforeUnmount(() => {
  // 如果需要，可以在这里销毁plotly图表
  if (Plotly && iChart.value) {
    try {
      Plotly.purge(iChart.value); // 清理plotly图表
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

  // Watch for changes to real-time mode
  // watch(isRealTimeMode, (newMode) => {
  //   if (newMode) {
  //     startRealTimeUpdates();
  //   } else {
  //     stopRealTimeUpdates();
  //     // When stopping real-time mode, re-render the chart to ensure proper state
  //     renderChart();
  //   }
  // })

  watch(
    ()=> [lineStore.xBarMean.yMeans, mainStore.isCollapse],
    async (newValues,oldValues)=> {
      if(newValues[0] !== oldValues[0]) {
        if (iChart.value) {  // 确保DOM元素存在
          await renderChart()
          // Only do a full re-render if not in real-time mode
          // if (!isRealTimeMode.value) {
          //   await renderChart()
          // }
        }
      }
      if(newValues[1] !== oldValues[1]) {
        nextTick(() => {
          handleResize()
        })
      }
    }
  )
})

// 监听AI面板动画完成事件
onMounted(() => {
  window.addEventListener('aiPanelTransitionEnd', handleResize);
})

// 组件卸载前清理事件监听器
onUnmounted(() => {
  window.removeEventListener('aiPanelTransitionEnd', handleResize);
});

</script>
<template>
  <div class="i-chart-container">
    <div ref="iChart" class="i-chart"></div>
  </div>
</template>
<style scoped>
.i-chart-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
}

.i-chart {
  flex: 1;
  width: 100%;
  height: 100%;
}
</style>
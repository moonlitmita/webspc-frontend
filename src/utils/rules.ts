/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

export function isOutsideControlLimits(data: number[], upperLimit: number, lowerLimit: number, date: string[]): { isOutside: boolean, outsidePoints: { x: number, y: number, message: string, add_date: string }[] } {
  let outsidePoints: { x: number, y: number, message: string, add_date: string }[] = []
  for(let i = 0; i < data.length; i++) {
    if(data[i]>upperLimit || data[i] < lowerLimit) {
      outsidePoints.push({x: i+1,y: data[i], message: "异常点, 准则1: 点超控制限", add_date: date[i]})
    }
  }
  return {
    isOutside: outsidePoints.length > 0,
    outsidePoints: outsidePoints
  }
}
export function isConsecutivePointsSameSide(data: number[],mean: number, date: string[]): { sameSide: boolean, segments: { x: number, y: number, message: string, add_date: string }[][]} {
  let count = 1
  let sameSidePoints: { x: number, y: number, message: string, add_date: string }[] = []
  let segments: { x: number, y: number, message: string, add_date: string }[][] = []
  for (let i=0; i < data.length; i++) {
    if (i<data.length&&(data[i] - mean) * (data[i+1] - mean) > 0) {
      count++;
      sameSidePoints.push({ x: i+1, y: data[i], message:"异常点, 准则2: 连续9点落在中心线同一侧", add_date: date[i] })
    } else {
      if(count >=9 ){
        sameSidePoints.push({ x: i+1, y: data[i], message:"异常点, 准则2: 连续9点落在中心线同一侧", add_date: date[i] })
        segments.push([...sameSidePoints])
      }
      count = 1
      sameSidePoints= []
    } 
  }
  return {
    sameSide: segments.length > 0,
    segments: segments
  };
}
export function isConsecutiveIncreasingOrDecreasingPoints(data: number[], date: string[]): { increasingOrDecreasing: boolean, segments: { x: number, y: number, message: string, add_date: string }[][] } {
  let count = 1
  let consecutivePoints: { x: number, y: number, message: string, add_date: string }[] = []
  let segments: { x: number, y: number, message: string, add_date: string }[][] = []
  let isIncreasing: boolean | null = null
  for (let i = 0; i < data.length; i++) {
    const diff = data[i+1]-data[i]
    if (isIncreasing === null) {
      if (diff > 0) {
        isIncreasing = true;
      } else if (diff < 0) {
        isIncreasing = false;
      }
    }
    if ((diff > 0 && isIncreasing) || (diff < 0 && !isIncreasing)) {
      count++;
      consecutivePoints.push({ x: i+1, y: data[i], message:"异常点, 准则3: 连续6点递增或递减", add_date: date[i] })
    } else {
      if (count >= 6) {
        consecutivePoints.push({ x: i+1, y: data[i], message:"异常点, 准则3: 连续6点递增或递减", add_date: date[i] })
        segments.push([...consecutivePoints])
      }
      count = 1
      consecutivePoints=[]
      isIncreasing = null
    }
  }
  return {
    increasingOrDecreasing: segments.length > 0,
    segments: segments
  }
}
export function isAlternatingPoints(data: number[], date: string[]): { alternating: boolean, segments: { x: number, y: number, message: string, add_date: string }[][] } {
  let count = 2
  let alternatingPoints: { x: number, y: number, message: string, add_date: string }[] = []
  let segments: { x: number, y: number, message: string, add_date: string }[][] = []
  for (let i = 0; i < data.length; i++) {
    if ((data[i+1] - data[i])*(data[i+2] - data[i+1]) < 0) {
      count++;
      alternatingPoints.push({ x: i+1, y: data[i], message:"异常点, 准则4: 连续14点中相邻点升降交错", add_date: date[i] })
    } else {
      if (count >= 14) {
        alternatingPoints.push({ x: i+1, y: data[i], message:"异常点, 准则4: 连续14点中相邻点升降交错", add_date: date[i] })
        alternatingPoints.push({ x: i+2, y: data[i+1], message:"异常点, 准则4: 连续14点中相邻点升降交错", add_date: date[i+1] })
        segments.push([...alternatingPoints])
      }
      count = 2;
      alternatingPoints = []
    }
  }
  return {
    alternating: segments.length > 0,
    segments: segments
  };
}
export function isOutsideControlZoneB(data: number[],mean: number, sigma: number, date: string[]): { outsideZoneB: boolean, segments: { x: number, y: number, message: string, add_date: string }[] } {
  let segments: { x: number, y: number, message: string, add_date: string }[] = []
  function condition (num: number): boolean {
    return Math.abs(num-mean) > 2*sigma
  }
  for (let i = 0; i < data.length; i++) {
    const subset: number[] = data.slice(i,i+3)
    const mappedSubset = subset.map((num, index) => ({
      x: i + index + 1,
      y: num,
      message: "异常点, 准则5: 连续3点中有2点落在中心线同一侧的B区之外",
      add_date: date[i + index]
    })).filter(item=> condition(item.y))
    if (mappedSubset.length===3) {
      segments.push(...mappedSubset)
    }
    if (mappedSubset.length===2) {
      if((mappedSubset[0].y-mean)*(mappedSubset[1].y-mean)>0) {
        segments.push(...mappedSubset)
      }
    }
  }
  let newSegments=segments.filter((obj,index,arr)=> {
    return index === arr.findIndex((o)=> o.y === obj.y && o.x === obj.x && o.message===obj.message)
  })
  return {
    outsideZoneB: segments.length > 0,
    segments: newSegments
  }
}
export function isOutsideControlZoneC(data: number[],mean: number, sigma: number, date: string[]): { outsideZoneC: boolean, segments: { x: number, y: number, message: string, add_date: string }[] } {
  let segments: { x: number, y: number, message: string, add_date: string }[] = []
  
  function condition (num: number): boolean {
    return Math.abs(num-mean) > sigma
  }
  function condition_2 (num: number) : number {
    return num - mean
  }
  for (let i = 0; i < data.length-4; i++) {
    const subset: number[] = data.slice(i,i+5)
    const mappedSubset = subset.map((num, index) => ({
      x: i + index + 1,
      y: num,
      message: "异常点, 准则6: 连续5点中有4点落在中心线同一侧的C区之外",
      add_date: date[i + index]
    })).filter(item=> condition(item.y))
    const signs: string[] =  mappedSubset.map(item => {
      if (condition_2(item.y)> 0) {
        return "positive";
      } else if (condition_2(item.y) < 0) {
        return "negative";
      } else {
        return "zero";
      }
    })
    const count: { positive: number, negative: number, zero: number } = signs.reduce((accumulator, currentValue) => {
      if (currentValue === "positive") {
        accumulator.positive++;
      } else if (currentValue === "negative") {
        accumulator.negative++;
      } else {
        accumulator.zero++;
      }
      return accumulator;
    }, { positive: 0, negative: 0, zero: 0 })
    if(mappedSubset.length>=4) {
      if(count.positive>=4 || count.negative>=4) {
        segments.push(...mappedSubset)
      }
    }
  }
  let newSegments=segments.filter((obj,index,arr)=> {
    return index === arr.findIndex((o)=> o.y === obj.y && o.x === obj.x && o.message===obj.message)
  })
  return {
    outsideZoneC: segments.length > 0,
    segments: newSegments
  }
}
export function isInsideControlZoneC(data: number[], mean: number, sigma: number, date: string[]): { insideZoneC: boolean, segments: { x: number, y: number, message: string, add_date: string }[] } {
  let consecutivePoints : { x: number, y: number, message: string, add_date: string}[] = []
  let segments: { x: number, y: number, message: string, add_date: string}[] = []
  function condition (num: number): boolean {
    return Math.abs(num-mean) < sigma
  }
  let count = 0;
  for (let i = 0; i < data.length; i++) {
    if (condition(data[i])) {
      count++;
      consecutivePoints.push ({x: i+1, y: data[i], message: "异常点, 准则7: 连续15点落在C区之内", add_date: date[i] })
    } else {
      if(count>=15) {
        segments.push(...consecutivePoints)
      }
      count = 0
      consecutivePoints = []
    }
  }
  return {
    insideZoneC: segments.length > 0,
    segments: segments
  }
}
export function isOutsideControlZoneCandBothSides(data: number[], mean: number, sigma: number, date: string[]): { outsideZoneC: boolean, segments: { x: number, y: number, message: string, add_date: string}[]} {
  let segments: { x: number, y: number, message: string, add_date: string }[] = []
  function condition (num: number): boolean {
    return Math.abs(num-mean) > sigma
  }
  for (let i = 0; i < data.length-7; i++) {
    const subset: number[] = data.slice(i,i+8)
    const mappedSubset = subset.map((num, index) => ({
      x: i + index + 1,
      y: num,
      message: "异常点, 准则8: 连续8点落在中心线两侧,但无1点在C区之内",
      add_date: date[i + index]
    })).filter(item=> condition(item.y))
    for(let j=0; j<subset.length; j++) {
      if((subset[j] - mean)*(subset[j+1] - mean) < 0 && mappedSubset.length===8) {
        segments.push(...mappedSubset)
        break
      }
    }
  }
  let newSegments=segments.filter((obj,index,arr)=> {
    return index === arr.findIndex((o)=> o.y === obj.y && o.x === obj.x && o.message===obj.message)
  })
  return {
    outsideZoneC: segments.length > 0,
    segments: newSegments
  }
}
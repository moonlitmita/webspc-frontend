  /* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import type { Outlier } from '../store/lineData'
  
export function buildOutlierHovertext(
  outliers: {x: number, y: number, message: string, add_date: string}[]
): string[] {
    const pointMessages = new Map<string, { message: string, add_date: string }[]>()
    //聚合函数，将同一坐标下的信息聚合在一起
    function addPoint(point: Outlier): void {
        const key = `${point.x}_${point.y}`
        const item = {message: point.message, add_date: point.add_date}
        const arr = pointMessages.get(key)
        if (arr) {
        arr.push(item)
        } else {
        pointMessages.set(key, [item])
        }
    }
    for(const point of outliers) {
        addPoint(point)
    }
    return outliers.map((point) => {
        const key = `${point.x}_${point.y}`
        const items = pointMessages.get(key)
        if (!items || items.length === 0) return ''

        // 每条记录占一行，格式：message (add_date)
        return items
        .map(({ message, add_date }) => `${message} (${add_date})`)
        .join('<br>')
    })
}
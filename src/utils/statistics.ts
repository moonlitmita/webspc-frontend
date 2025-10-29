/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

interface D2TableEntry {
  n: number;
  d2: number;
}
interface D3TableEntry {
  n: number;
  D3: number;
}
interface D4TableEntry {
  n: number;
  D4: number;
}

const d2Table: D2TableEntry[] = [
  { n: 2, d2: 1.128 },
  { n: 3, d2: 1.693 },
  { n: 4, d2: 2.059 },
  { n: 5, d2: 2.326 },
  { n: 6, d2: 2.534 },
  { n: 7, d2: 2.704 },
  { n: 8, d2: 2.847 },
  { n: 9, d2: 2.970 },
  { n: 10, d2: 3.078 },
]

const tableD3: D3TableEntry[] = [
  { n: 2, D3: 0.000 },
  { n: 3, D3: 0.000 },
  { n: 4, D3: 0.000 },
  { n: 5, D3: 0.000 },
  { n: 6, D3: 0.000 },
  { n: 7, D3: 0.076 },
  { n: 8, D3: 0.136 },
  { n: 9, D3: 0.184 },
  { n: 10, D3: 0.223 },
  { n: 11, D3: 0.256 },
  { n: 12, D3: 0.283 },
  { n: 13, D3: 0.307 },
  { n: 14, D3: 0.328 },
  { n: 15, D3: 0.347 },
  { n: 16, D3: 0.363 },
  { n: 17, D3: 0.378 },
  { n: 18, D3: 0.391 },
  { n: 19, D3: 0.403 },
  { n: 20, D3: 0.415 },
  { n: 21, D3: 0.425 },
  { n: 22, D3: 0.434 },
  { n: 23, D3: 0.443 },
  { n: 24, D3: 0.451 },
  { n: 25, D3: 0.459 },
]

const tableD4: D4TableEntry[] = [
  { n: 2, D4: 3.267 },
  { n: 3, D4: 2.574 },
  { n: 4, D4: 2.282 },
  { n: 5, D4: 2.114 },
  { n: 6, D4: 2.004 },
  { n: 7, D4: 1.924 },
  { n: 8, D4: 1.864 },
  { n: 9, D4: 1.816 },
  { n: 10, D4: 1.777 },
  { n: 11, D4: 1.744 },
  { n: 12, D4: 1.717 },
  { n: 13, D4: 1.693 },
  { n: 14, D4: 1.672 },
  { n: 15, D4: 1.653 },
  { n: 16, D4: 1.637 },
  { n: 17, D4: 1.622 },
  { n: 18, D4: 1.608 },
  { n: 19, D4: 1.597 },
  { n: 20, D4: 1.585 },
  { n: 21, D4: 1.575 },
  { n: 22, D4: 1.566 },
  { n: 23, D4: 1.557 },
  { n: 24, D4: 1.548 },
  { n: 25, D4: 1.541 },
]

export function getD2(sampleSize: number): number {
  const d2Value = d2Table.find((entry) => entry.n === sampleSize)?.d2;
  if (d2Value === undefined) {
    throw new Error(`找不到样本容量为 ${sampleSize} 的 d2 值`)
  }
  return d2Value
}
export function getD3(sampleSize: number): number {
  const D3Value = tableD3.find((entry) => entry.n === sampleSize)?.D3;
  if (D3Value === undefined) {
    throw new Error(`找不到样本容量为 ${sampleSize} 的 D3 值`)
  }
  return D3Value;
}
export function getD4(sampleSize: number): number {
  const D4Value = tableD4.find((entry) => entry.n === sampleSize)?.D4;
  if (D4Value === undefined) {
    throw new Error(`找不到样本容量为 ${sampleSize} 的 D4 值`)
  }
  return D4Value;
}
export function calculateSampleStandardDeviation(data: number[], xBar: number): number {
  const n = data.length;
  if (n <= 1) {
    return 0
  }
  const sumSquares = data.reduce((sum, value) => sum + Math.pow(value - xBar, 2), 0);
  const variance = sumSquares / (n - 1)
  const sampleStdDeviation = Math.sqrt(variance)
  return sampleStdDeviation
}
export function cp_pp(USL:number,LSL: number,sigma: number): number {
  return (USL-LSL)/6*sigma
}
export function cpk_ppk(USL:number,LSL: number, xBar: number, sigma: number) {
  return Math.min((USL - xBar) / (3 * sigma), (xBar - LSL) / (3 * sigma))
}

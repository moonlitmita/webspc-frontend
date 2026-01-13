/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

//将时间字符串转为Unix时间戳(秒)
export function strToUnix(str: string): number {
  return Math.floor(new Date(str + ' GMT').getTime() / 1000);
}
/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { chatRequest } from "./request"

export interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
  streaming?: boolean
}

export interface HistorySession {
  conversation_id: string
  title: string
  message_count: number
}

export interface GetSessionHistoryResponse {
  code: string
  data: {
    history_sessions: HistorySession[]
    message: string
  }
}

export interface GetSessionDetailResponse {
  code: string
  data: {
    session_detail: Message[]
    message: string
  }
}

export const sessionApi= {
  endSession(cid?: string) {
    return chatRequest({
      url: cid 
      ? `session/end_session?conversation_id=${encodeURIComponent(cid)}`
      : `session/end_session`,
      method: 'get',
      mock: false
    })
  },
  getSessionHistory(params: any) {
    return chatRequest({
      url: 'session/history',
      method: 'get',
      mock: false,
      data: params
    })
  },
  getSessionDetail(cid: string) {
    return chatRequest({
      url: cid 
      ? `session/detail?conversation_id=${encodeURIComponent(cid)}`
      : `session/detail`,
      method: 'get',
      mock: false
    })
  },
  deleteSession(cid: string) {
    return chatRequest({
      url: 'session/history',
      method: 'delete',
      mock: false,
      params: { conversation_id: cid }
    })
  },
  deleteSessions(cids: string[]) {
    return chatRequest({
      url: 'session/history/batch',
      method: 'delete',
      mock: false,
      params: { conversation_ids: cids }
    })
  }
}
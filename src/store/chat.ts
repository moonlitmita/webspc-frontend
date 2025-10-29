/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

import { defineStore } from "pinia"
import type { Message, GetSessionHistoryResponse, GetSessionDetailResponse } from '../api/sessionApi'
import { sessionApi } from "../api/sessionApi";
import { fetchStream } from "@/utils/fetchStream";
import { useEventBus } from '@vueuse/core'
import { nextTick } from "vue";
import { ElMessage } from "element-plus";

const bus = useEventBus<void>('chat:scroll')

interface ChatState {
  messages: Message[]
  inputText: string
  msgLoading: boolean
  dataLoading: boolean
  showAllSessions: boolean
  extraData: any
  historySessions: GetSessionHistoryResponse['data']['history_sessions']
  session_detail: GetSessionDetailResponse['data']['session_detail']
  activeSession: string
}

export const useChatStore = defineStore('chat', {
  state: (): ChatState => {
    return {
      messages: [],
      inputText: "",
      msgLoading: false,
      dataLoading: false,
      showAllSessions: false,
      extraData: '',
      historySessions: [],
      session_detail: [],
      activeSession: ""
      }
  },
  getters: {},
  actions: {
    // 添加一条消息（内部用）
    pushMessage(role: 'user' | 'assistant', content = '', streaming = false, extraData?: any) {
      // 如果带了数据，就拼成统一格式
      if (extraData !== undefined) {
        content += `\n\n<!--DATA:${JSON.stringify(extraData)}-->`
      }
      this.extraData = extraData
      const msg: Message = { role, content, streaming, loading: streaming }
      this.messages.push(msg)
      return msg // 返回引用，方便后面追加
    },
    clearInput() {
      this.inputText = ''
    },
    // 核心：发送 + 流式接收
    async sendMessage() {
      const text = this.inputText.trim()
      if(!text) return
      this.pushMessage('user', text)
      this.clearInput()
      this.msgLoading = true
      const assistantMsg = this.pushMessage('assistant', '', true)
      try {
        const stream = await fetchStream({
          url: '/chat/stream',
          method: 'POST',
          data: { messages: this.messages }
        })

        const reader = stream.body!.getReader()
        const decoder = new TextDecoder()
        
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            assistantMsg.loading = false
            assistantMsg.streaming = false
            break
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const ln of lines) {
            if (ln.startsWith('data: ')) {
              const json = ln.slice(6)
              // console.log(new Date().toLocaleTimeString(), json)
              if (json === '[DONE]') {
                assistantMsg.loading = false
                assistantMsg.streaming = false
                return
              }
              const { delta } = JSON.parse(json)
              if (delta) {
                const last = this.messages[this.messages.length - 1]
                // console.log('帧到达', delta, '内容长度=', last.content.length)
                last.content += delta
                // console.log('内容立即变为', last.content.length)
                nextTick(() => {
                  bus.emit()
                })
              }
            }
          }
        }
      } catch (error) {
        ElMessage.error('解析失败')
        assistantMsg.content = '抱歉，请求异常，请稍后重试'
        assistantMsg.loading = false
        assistantMsg.streaming = false
      } finally {
        this.msgLoading = false
      }
    },
    async sendData(data: any) {
      const text = '请对以下数据进行分析'
      this.pushMessage('user', text, false, data)
      if (!this.extraData) return   // 没数据 → 直接返回
      this.clearInput()
      this.dataLoading = true
      const assistantMsg = this.pushMessage('assistant', '', true)
      try {
        const stream = await fetchStream({
          url: '/chat/stream',
          method: 'POST',
          data: { messages: this.messages }
        })
        const reader = stream.body!.getReader()
        const decoder = new TextDecoder()
        
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            assistantMsg.loading = false
            assistantMsg.streaming = false
            break
          }
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const ln of lines) {
            if (ln.startsWith('data: ')) {
              const json = ln.slice(6)
              if (json === '[DONE]') {
                assistantMsg.loading = false
                assistantMsg.streaming = false
                return
              }
              const { delta } = JSON.parse(json)
              if (delta) {
                const last = this.messages[this.messages.length - 1]
                last.content += delta
                nextTick(() => {
                  bus.emit()
                })
              }
            }
          }
        }
      } catch (e) {
        assistantMsg.content = '抱歉，请求异常，请稍后重试'
        assistantMsg.loading = false
        assistantMsg.streaming = false
      } finally {
        this.dataLoading = false
      }
    },
    async getSessionHistory(): Promise<void> {
      try {
        const res: GetSessionHistoryResponse = await sessionApi.getSessionHistory({})
        if (res.data && res.data.history_sessions) {
          this.historySessions = res.data.history_sessions
        }
      } catch (error) {
        ElMessage.error('会话历史获取失败')
      }
    },
    async endSession() {
      try {
        const res = await sessionApi.endSession(this.activeSession)
        this.session_detail = []
        this.messages = []
        this.activeSession = ""
        this.getSessionHistory()
      } catch (error) {
        ElMessage.error('网络异常，请重试')
      }
    },
    async getSessionDetail(conversation_id: string): Promise<void> {
      try {
        const res: GetSessionDetailResponse = await sessionApi.getSessionDetail(conversation_id)
        if(res.data && res.data.session_detail) {
          this.session_detail = res.data.session_detail
          // 将会话详情设置为当前消息
          this.messages = res.data.session_detail
          this.activeSession = conversation_id
          this.showAllSessions = false
        }
      } catch (error) {
        ElMessage.error('获取会话详情失败')
      }
    },
    async newSession () {
      try {
        await this.endSession()
        await this.getSessionHistory()
      } catch (error) {
        ElMessage.error('解析失败')
      } finally {
        //
      }
      this.messages = []
    },
    async deleteSession(conversation_id: string) {
      try {
        const res = await sessionApi.deleteSession(conversation_id)
        this.getSessionHistory()
      } catch (error) {
        ElMessage.error('删除会话失败')
        throw error
      }
    }
  },
  persist: true
})

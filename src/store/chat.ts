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
  // extraData: any  // 已移除，使用每条消息自身的 extraData
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
      historySessions: [],
      session_detail: [],
      activeSession: ""
      }
  },
  getters: {},
  actions: {
    // 添加一条消息（简化：不再处理 extraData 拼接）
    pushMessage(role: 'user' | 'assistant', content = '', streaming = false, extraData?: any) {
      const msg: Message = { role, content, streaming, loading: streaming, extraData }
      this.messages.push(msg)
      return msg
    },

    clearInput() {
      this.inputText = ''
    },

    // 核心：发送 + 流式接收（普通文本）
    async sendMessage() {
      const text = this.inputText.trim()
      if (!text) return

      this.pushMessage('user', text)
      this.clearInput()
      this.msgLoading = true

      const assistantMsg = this.pushMessage('assistant', '', true)

      try {
        const res = await fetchStream({
          url: '/chat/stream',
          method: 'POST',
          data: {
            messages: this.messages.map(m => ({ role: m.role, content: m.content })),
            extraData: null
          }
        })
        if (!res) return

        // 从响应头获取 conversation_id
        const conversationId = res.headers.get('X-Conversation-ID')
        if (conversationId) {
          this.activeSession = conversationId
        }

        await this.handleStream(res, assistantMsg)
      } catch (error) {
        ElMessage.error('解析失败')
        assistantMsg.content = '抱歉，请求异常，请稍后重试'
        assistantMsg.loading = false
        assistantMsg.streaming = false
      } finally {
        this.msgLoading = false
      }
    },

    // 发送数据（带 extraData）
    async sendData(data: any) {
      // ✅ 提前截断数据，避免 124k token 错误
      // const trimmedData = this.trimExtraData(data)

      const text = '请对以上数据进行分析'
      this.pushMessage('user', text, false, data)

      if (!data || Object.keys(data).length === 0) {
        this.dataLoading = false
        return
      }

      this.clearInput()
      this.dataLoading = true

      const assistantMsg = this.pushMessage('assistant', '', true)

      try {
        const res = await fetchStream({
          url: '/chat/stream',
          method: 'POST',
          data: {
            messages: this.messages.map(m => ({ role: m.role, content: m.content })),
            extraData: data  // ✅ 独立字段发送
          }
        })
        if (!res) return

        // 从响应头获取 conversation_id
        const conversationId = res.headers.get('X-Conversation-ID')
        if (conversationId) {
          this.activeSession = conversationId
        }

        await this.handleStream(res, assistantMsg)
      } catch (e) {
        assistantMsg.content = '抱歉，请求异常，请稍后重试'
        assistantMsg.loading = false
        assistantMsg.streaming = false
      } finally {
        this.dataLoading = false
      }
    },

    // 提取公共的流式处理逻辑
    async handleStream(stream: Response, assistantMsg: Message) {
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
              nextTick(() => bus.emit())
            }
          }
        }
      }
    },

    async getSessionHistory(): Promise<void> {
      try {
        const res: GetSessionHistoryResponse = await sessionApi.getSessionHistory({})
        if (!res) return  //该行代码用于阻拦token过期后跳转登录页面错误冒泡
        if (res.data && res.data.history_sessions) {
          this.historySessions = res.data.history_sessions
        }
      } catch (error) {
        ElMessage.error('会话历史获取失败')
      }
    },
    async endSession() {
      // 如果没有活跃会话，直接返回（无需调用后端）
      if (!this.activeSession) {
        return
      }
      try {
        const res = await sessionApi.endSession(this.activeSession)
        if (!res) return  //该行代码用于阻拦token过期后跳转登录页面错误冒泡
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
        if (!res) return  //该行代码用于阻拦token过期后跳转登录页面错误冒泡
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

/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="chat-box">
    <div class="chat-header">
      <div class="buttons-container">
        <el-button type="primary" @click="chatStore.sendData(dataToSend)" :loading="chatStore.dataLoading">
          传送数据
        </el-button>
        <el-button type="primary" @click="chatStore.newSession">
          新建会话
        </el-button>
        <!-- <ModelSelector /> -->
      </div>
      <el-icon class="close" @click="mainStore.toggleAi"><Close /></el-icon>
    </div>

    <div class="chat-body" ref="chatBodyRef">
      <section class="session-box">
        <!-- 顶部选择按钮区域，仅在展示全部时显示 -->
        <div v-if="chatStore.showAllSessions && chatStore.historySessions.length > 1" class="selection-controls">
          <el-checkbox
            v-model="isSelectAll"
            :indeterminate = "isIndeterminate"
            @change="handleCheckAllChange"
          >
            全部选择
          </el-checkbox>
        </div>
        
        <!-- 消息体 -->
        <main ref="chatBody" class="history-body">
          <el-checkbox-group
            v-if="chatStore.showAllSessions"
            v-model="selectedSessions"
            @change="handleCheckedSessionsChange"
          >
            <transition-group name="fade" tag="div">
              <div
                v-for="s in displayList"
                :key="s.conversation_id"
                class="session-item"
                :class="{ 'selected': selectedSessions.includes(s.conversation_id) }"
              >
                <!-- 仅在展示全部时显示选择框 -->
                <div class="session-item-content">
                  <el-checkbox
                    @click.stop
                    class="session-checkbox"
                    :label="s.conversation_id"
                  >
                    <span style="display: none;">{{ s.conversation_id }}</span>
                  </el-checkbox>
                  <div class="session-text" @click.stop="loadSession(s.conversation_id)">
                    <span class="session-title">{{ s.title }}</span>
                    <span class="session-info">({{ s.message_count }}条消息)</span>
                  </div>
                </div>
              </div>
            </transition-group>
          </el-checkbox-group>
          
          <!-- 在非展示全部模式下，直接显示会话内容 -->
          <div v-else>
            <transition-group name="fade" tag="div">
              <div
                v-for="s in displayList"
                :key="s.conversation_id"
                class="session-item"
              >
                <div 
                  class="session-text" 
                  @click="loadSession(s.conversation_id)"
                >
                  <span class="session-title">{{ s.title }}</span>
                  <span class="session-info">({{ s.message_count }}条消息)</span>
                </div>
              </div>
            </transition-group>
          </div>
        </main>

        <!-- 底部按钮 -->
        <footer class="session-footer">
          <!-- 删除按钮，仅在有选中项时显示 -->
          <button 
            v-if="chatStore.showAllSessions && selectedSessions.length > 0" 
            class="delete-btn" 
            @click="deleteSelectedSessions"
          >
            删除 ({{ selectedSessions.length }})
          </button>
          <button v-if="!chatStore.showAllSessions && chatStore.historySessions.length > 1" class="show-all-btn" @click="chatStore.showAllSessions = true">
            展示全部 ({{ chatStore.historySessions.length }})
          </button>
          <button v-else-if="chatStore.historySessions.length > 1" class="show-all-btn" @click="chatStore.showAllSessions = false">
            收起
          </button>
        </footer>
      </section>
      <div
        v-for="(msg, idx) in chatStore.messages"
        :key="idx"
        class="msg"
        :class="{ 'msg--user': msg.role === 'user' }"
      >
        <div class="msg__bubble">
          <div v-if="msg.streaming" v-html="renderMarkdown(msg.content, msg.extraData)" />
          <div v-else v-html="renderMarkdown(msg.content, msg.extraData)" />
          <el-icon
            v-if="msg.role === 'assistant' && msg.loading"
            class="loading"
            >
            <Loading/>
          </el-icon>
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <div class="textarea-container">
        <textarea
          ref="textareaRef"
          v-model="chatStore.inputText"
          @keydown="onKeyDown"
          @input="adjustTextareaHeight"
          placeholder="说点什么..."
          :disabled="chatStore.msgLoading || chatStore.dataLoading"
        />
        <el-button 
          :class="['send-button', { 'has-text': chatStore.inputText.trim() }]"
          @click="chatStore.sendMessage" 
          :loading="chatStore.msgLoading" 
          :disabled="chatStore.dataLoading || !chatStore.inputText.trim()"
        >
          <el-icon style="font-size: 16px;"><Top /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Close, Loading, Top } from '@element-plus/icons-vue'
import { useMainStore } from '../../store/index'
import { useChatStore } from '../../store/chat'
import { useLineStore } from '@/store/lineData'
import { useEventBus } from '@vueuse/core'

const mainStore = useMainStore()
const chatStore = useChatStore()
const lineStore = useLineStore()
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selectedSessions = ref<string[]>([])
const isSelectAll = ref(false)
const isIndeterminate = ref(true)

// 拿原始对象（去掉响应式，适合上传）
import { toRaw } from 'vue'
const rawData = toRaw(lineStore.$state) 

// 解构获取多个字段，提供默认值以避免 TypeScript 错误
const {
  chartDataList_pagination = [],
  chartDataList_all = [],
  spcType = '',
  process = '',
  product = '',
  projectName = '',
  sampleSize = 0,
  USL = 0,
  LSL = 0,
  iUCL = 0,
  iLCL = 0,
  mrUCL = 0,
  mrLCL = 0,
  rUCL = 0,
  rLCL = 0,
  xbarUCL = 0,
  xbarLCL = 0,
  dataCollectionType = '',
  iOutliers = [],
  mrOutliers = [],
  rOutliers = [],
  xbarOutliers = []
} = rawData

// 发送时只传需要的字段
const dataToSend = {
  chartDataList_pagination: chartDataList_pagination || [],  // 当前页数据（较小）
  chartDataList_all: (chartDataList_all || []).slice(-150), // 截断：只传最后150条
  spcType,
  process,
  product,
  projectName,
  sampleSize,
  USL,
  LSL,
  iUCL,
  iLCL,
  mrUCL,
  mrLCL,
  rUCL,
  rLCL,
  xbarUCL,
  xbarLCL,
  dataCollectionType,
  iOutliers: (iOutliers || []).slice(-50),
  mrOutliers: (mrOutliers || []).slice(-50), // 异常点也可能很多，截断
  rOutliers: (rOutliers || []).slice(-50),
  xbarOutliers: (xbarOutliers || []).slice(-50)
}

const chatBodyRef = ref<HTMLDivElement>()
const latest1 = computed(() => chatStore.historySessions.slice(-1))
const displayList = computed(() => chatStore.showAllSessions ? chatStore.historySessions : latest1.value)

// 加载会话详情
async function loadSession(conversationId: string) {
  await chatStore.getSessionDetail(conversationId)
  await chatStore.getSessionHistory()
}

const handleCheckAllChange = (val: boolean) => {
  if (val) {
    selectedSessions.value = chatStore.historySessions.map(session => session.conversation_id)
  } else {
    selectedSessions.value = []
  }
  isIndeterminate.value = false
  isSelectAll.value = val
}

const handleCheckedSessionsChange = (value: string[]) => {
  const checkedCount = value.length
  isSelectAll.value = checkedCount === chatStore.historySessions.length && checkedCount > 0
  isIndeterminate.value = checkedCount > 0 && checkedCount < chatStore.historySessions.length
}

// 删除选中的会话
async function deleteSelectedSessions() {
  if (selectedSessions.value.length === 0) return;
  
  // 记录要删除的会话数量用于提示
  const deleteCount = selectedSessions.value.length;
  
  try {
    // 调用 API 删除选中的会话
    for (const sessionId of selectedSessions.value) {
      await chatStore.deleteSession(sessionId);
    }
    // Clear selection after deletion
    selectedSessions.value = [];
    isSelectAll.value = false;
    isIndeterminate.value = false;
    // Refresh the session list
    await chatStore.getSessionHistory();
    
    // 如果当前会话被删除且列表为空，创建新会话
    if (chatStore.historySessions.length === 0) {
      await chatStore.newSession()
    } 
    // 否则如果当前会话被删除，加载第一个会话
    else if (!chatStore.historySessions.some(session => session.conversation_id === chatStore.activeSession)) {
      await chatStore.getSessionDetail(chatStore.historySessions[0].conversation_id);
    }
    ElMessage.success(`${deleteCount} 个会话已删除`);
  } catch (error) {
    ElMessage.error('删除会话失败');
  }
}

/* 自动滚动到底部 */
function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

function onKeyDown(e: KeyboardEvent) {
  // Shift + Enter → 手动换行 + 不发送
  if (e.shiftKey && e.key === 'Enter') {
    e.preventDefault()                       // 阻止默认换行（避免触发发送）
    const target = e.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    // 在光标处插入换行符
    chatStore.inputText =
      chatStore.inputText.slice(0, start) + '\n' + chatStore.inputText.slice(end)
    // 恢复光标位置
    nextTick(() => {
      target.selectionStart = target.selectionEnd = start + 1
      adjustTextareaHeight() // 调整高度
    })
    return
  }

  // 单独 Enter → 发送消息
  if (!e.shiftKey && e.key === 'Enter' && !e.isComposing) {
    e.preventDefault()
    chatStore.sendMessage() // 你的发送逻辑
  }
}

/* 调整 textarea 高度 */
function adjustTextareaHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto' // 重置高度
    textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px' // 设置新高度
  }
}

/* 打招呼 */
onMounted(async () => {
  useEventBus<void>('chat:scroll').on(scrollToBottom)
  // 初始化 textarea 高度
  adjustTextareaHeight()
  // 获取会话历史
  await chatStore.getSessionHistory()
})

// 监听 showAllSessions的变化，重置选择状态
watch(
  () => [chatStore.showAllSessions],
  (newValues,oldValues) => {
    if(newValues[0] !== oldValues[0]) {
      // 当收起时，清空所有选择状态
      selectedSessions.value = [];
      isSelectAll.value = false;
      isIndeterminate.value = false;
    }
  }
)

// 监听会话列表变化，确保选择状态正确
watch(
  () => [...chatStore.historySessions.map(s => s.conversation_id)], 
  (newSessionIds) => {
    // 过滤掉不存在的会话ID
    selectedSessions.value = selectedSessions.value.filter(id => 
      newSessionIds.includes(id)
    );
    
    // 更新全选状态
    const checkedCount = selectedSessions.value.length;
    isSelectAll.value = checkedCount === newSessionIds.length && checkedCount > 0;
    isIndeterminate.value = checkedCount > 0 && checkedCount < newSessionIds.length;
  }, 
  { deep: true }
)

/* 简易 markdown 渲染（ElementPlus 无自带，可换成 marked） */
function renderMarkdown(text: string, extraData?: any) {
  // 如果存在 extraData，则添加数据详情卡片
  if (extraData && Object.keys(extraData).length > 0) {
    // 生成折叠卡片 HTML
    const card = `
      <details class=\"data-details\">
        <summary>📊 数据详情</summary>
        <pre><code class=\"language-json\">${JSON.stringify(extraData, (k, v) =>
    Array.isArray(v) ? v.map(item => JSON.stringify(item)).join(', ') : v, 2)}</code></pre>
      </details>`
    // 在文本开头插入卡片
    text = card + text
  }

  // 首先转义特殊字符，避免影响后续 markdown 解析
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 处理代码块，防止其中的 * 被误解析
  text = text.replace(/(```[\s\S]*?```|`[^`]*`)/g, function(match) {
    return match
      .replace(/\*\*/g, '&ast;&ast;') // 临时转义代码块中的 **
      .replace(/\*/g, '&ast;') // 临时转义代码块中的 *
  })

  text = text
    .replace(/```json\\n([\\s\\S]*?)\\n```/g, '<pre><code class=\"language-json\">$1</code></pre>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 修正正则表达式，去掉多余的转义
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 修正正则表达式，去掉多余的转义
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\\n/g, '<br />')
    .replace(/^\\n+|\\n+$/g, '')

  // 恢复之前转义的特殊字符
  text = text
    .replace(/&ast;&ast;/g, '**') // 恢复代码块中的 **
    .replace(/&ast;/g, '*') // 恢复代码块中的 *
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
  return text
}
</script>

<style scoped>
.chat-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #f9f9f9;
}

.chat-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  border-bottom: 1px solid #e4e7ed;
  .session-box {
  width: 100%;
  margin-bottom: 5px;
  }
}

.show-more-container {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.msg {
  display: flex;
  margin-bottom: 12px;
}

.msg--user {
  justify-content: flex-end;
}

.msg__bubble {
  max-width: 90%;
  padding: 8px 12px;
  border-radius: 8px;
  background: #e4e7ed;
  position: relative;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: normal;
}

/* 专门处理超链接 */
.msg__bubble a {
  color: #0969da;
  text-decoration: underline;
  word-break: break-all;      /* ← 核心 */
  overflow-wrap: break-word;  /* ← 兼容 */
}

.msg--user .msg__bubble {
  background: #409eff;
  color: #fff;
}

.loading {
  margin-left: 4px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chat-footer {
  padding: 7px 8px 4px 8px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

/* 会话历史样式 */
.history-body {
  padding: 10px;
}

.session-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: background-color 0.3s;
}

.session-item:hover {
  background-color: #eef2f7;
}

.session-title {
  font-size: 14px;
  color: #666;
}

.session-info {
  font-size: 12px;
  color: #666;
}

.show-all-btn {
  width: 100%;
  padding: 10px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.show-all-btn:hover {
  background-color: #337ecc;
}

.delete-btn {
  width: 100%;
  padding: 10px;
  background-color: #f56c6c; /* 红色背景 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 10px;
}

.delete-btn:hover {
  background-color: #e45a5a;
}

.selection-controls {
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
}

.session-item-content {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.session-checkbox {
  margin-right: 10px;
}

.session-text {
  flex: 1;
  cursor: pointer;
  display: flex;
}

.session-item.selected {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}
:deep(.data-details pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  font-size: 12px;
  padding: 8px;
  background: #f9f9f9;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.buttons-container {
  display: flex;
  gap: 8px; /* 按钮间距 */
}

.textarea-container {
  position: relative;
  min-height: 60px;
  max-height: 200px;
}

.chat-footer textarea {
  width: 100%;
  min-height: 60px;
  max-height: 200px;
  resize: none;
  padding: 8px 8px 8px 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  overflow-y: auto;
}

.send-button {
  position: absolute;
  right: 0px;
  bottom: 8px;
  padding: 6px 12px;
  background-color: #c0c4cc; /* 浅色 */
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
}

.send-button.has-text {
  background-color: #409eff; /* 深色 */
}

.send-button:disabled {
  background-color: #c0c4cc !important;
  cursor: not-allowed;
}
</style>
















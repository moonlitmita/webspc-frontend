/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="mcp-config-container">
    <div class="header">
      <h2>MCP配置管理</h2>
    </div>
    <el-row :gutter="20">
      <!-- 左侧 MCP Server 列表 -->
      <el-col :span="8">
        <div class="mcp-server-list">
          <div class="toolbar">
            <span class="title">MCP Servers</span>
          </div>
          <div class="server-list">
            <div
              v-for="(server, name) in mcpStore.mcpServers || {}"
              :key="name"
              class="server-item"
            >
              <el-switch
                v-model="serverEnabled[name]"
                @change="toggleServer(String(name), server)"
                inline-prompt
                :active-icon="Check"
                :inactive-icon="Close"
              />
              <span class="server-name">{{ name }}</span>
            </div>
            <div v-if="!mcpStore.mcpServers || Object.keys(mcpStore.mcpServers).length === 0" class="empty">
              暂无 MCP Servers 配置
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧 JSON 配置 -->
      <el-col :span="16">
        <div class="mcp-json-view">
          <div class="toolbar">
            <span class="title">MCP Server Config</span>
            <div>
              <!-- 编辑/只读 切换 -->
              <el-button size="small" @click="toggleEdit">
                {{ editing ? '取消' : '编辑' }}
              </el-button>
              <el-button
                v-if="editing"
                type="primary"
                size="small"
                @click="saveConfig"
                :loading="saving"
              >
                保存
              </el-button>
              <el-button size="small" @click="handleCopy">复制</el-button>
            </div>
          </div>

          <!-- 只读：高亮显示 -->
          <pre v-if="!editing" class="json-code"><code v-html="highlighted"></code></pre>

          <!-- 编辑：文本框 -->
          <el-input
            v-else
            v-model="editText"
            type="textarea"
            :rows="20"
            class="json-edit"
          />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useMCPStore } from '@/store/mcp'
import type { MCPServerItem, MCPServers } from '../../api/mcpApi'
import { Check, Close } from '@element-plus/icons-vue'

/* store 数据 */
const mcpStore = useMCPStore()

onMounted(()=> {
  mcpStore.loadConfig()
})

/* ※ 编辑状态 */
const editing = ref(false)
const editText = ref('')
const saving = ref(false)

/* Server 启用状态 */
const serverEnabled = ref<Record<string, boolean>>({})

// 监听 mcpServers 变化，初始化启用状态
watch(
  () => mcpStore.mcpServers,
  (newServers) => {
    const enabled: Record<string, boolean> = {}
    if (newServers) {
      Object.keys(newServers).forEach((name) => {
        // 默认所有 server 都是启用的
        enabled[name] = newServers[name].disabled !== true
      })
    }
    serverEnabled.value = enabled
  },
  { immediate: true, deep: true }
)

/* 切换 Server 启用状态 */
function toggleServer(name: string, server: MCPServerItem) {
  const isEnabled = serverEnabled.value[name]
  // 更新 server 配置中的 disabled 状态
  server.disabled = !isEnabled
  ElMessage.success(`${name} 已${isEnabled ? '启用' : '禁用'}`)
  mcpStore.updateConfig()
}

/* 进入编辑 */
function toggleEdit() {
  editing.value = !editing.value
  if (editing.value) {
    // 把当前配置转成字符串丢进文本框
    editText.value = JSON.stringify(mcpStore.mcpServers || {}, null, 2)
  }
}

/* 保存 */
async function saveConfig() {
  saving.value = true
  try {
    // 1. 解析文本框内容
    const newConfig: MCPServers = JSON.parse(editText.value)
    mcpStore.mcpServers = newConfig
    // 2. 调后端
    const res = await mcpStore.updateConfig()
    // 3. 成功后刷新 store
    await mcpStore.loadConfig()          // 重新拉一遍
    ElMessage.success(res?.message || '配置已保存')
    editing.value = false
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e.message || e))
  } finally {
    saving.value = false
  }
}

/* 高亮、复制 */
const highlighted = computed(() => {
  const json = JSON.stringify(mcpStore.mcpServers || {}, null, 2)
  return json
    .replace(/"(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?/g, '<span class="json-key">$&</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="json-bool">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>')
})

async function handleCopy() {
  await navigator.clipboard.writeText(JSON.stringify(mcpStore.mcpServers || {}, null, 2))
  ElMessage.success('已复制')
}
</script>

<style scoped>
.mcp-config-container {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding: 30px;
}

.header {
  margin-bottom: 20px; /* 调整标题下方间距 */
  align-self: flex-start; /* 保持左对齐 */
}

.header h2 {
  margin: 0;
  color: #303133;
  padding-left: 2px; /* 与标签保持一致的左边距 */
}

.mcp-server-list {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  padding: 12px;
  height: 100%;
}

.mcp-server-list .toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.server-list {
  max-height: 400px;
  overflow-y: auto;
}

.server-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.server-item:last-child {
  border-bottom: none;
}

.server-name {
  margin-left: 12px;
  font-size: 14px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}

.mcp-json-view {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  padding: 12px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.json-code {
  margin: 0;
  overflow: auto;
  max-height: 400px;
}

/* 简易高亮颜色 */
.json-key   { color: #096; }
.json-number { color: #07c; }
.json-bool  { color: #e66; }
.json-edit {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
}
</style>

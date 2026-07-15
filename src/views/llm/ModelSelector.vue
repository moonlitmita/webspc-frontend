/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="llm-container">
    <div class="header">
      <h2>LLM管理</h2>
    </div>
    <div class="model-selector">
      <div class="selector-pair">
        <div class="selector-group">
          <label class="selector-label">API提供商</label>
          <el-select
            v-model="provider"
            placeholder="请选择提供商"
            @change="onProviderChange"
            size="default"
            class="model-select"
          >
            <el-option
              v-for="p in modelStore.providers"
              :key="p.key"
              :label="p.label"
              :value="p.key"
            >
            </el-option>
          </el-select>
        </div>
        <div class="selector-group">
          <label class="selector-label">大模型</label>
          <el-select
            v-model="model_id"
            :disabled="!provider"
            placeholder="请选择模型"
            class="model-select"
          >
            <el-option
              v-for="m in modelStore.modelsByProvider"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            >
            </el-option>
          </el-select>
        </div>
        <el-button
          type="primary"
          :loading="modelStore.loading"
          :disabled="!provider || !model_id"
          @click="handleApply"
          class="apply-btn"
        >
          应用
        </el-button>
      </div>
    </div>
    
    <!-- 模型配置编辑区域 -->
    <div class="model-config-container">
      <div class="config-header">
        <h3>模型配置管理</h3>
        <div class="config-actions">
          <el-button size="small" @click="toggleEdit">
            {{ editing ? '取消' : '编辑' }}
          </el-button>
          <el-button
            v-if="editing"
            type="primary"
            size="small"
            @click="saveConfigs"
            :loading="modelStore.loading"
          >
            保存
          </el-button>
          <el-button size="small" @click="handleCopy">复制</el-button>
        </div>
      </div>

      <!-- 只读：高亮显示 -->
      <pre v-if="!editing" class="json-config"><code v-html="highlightedConfigs"></code></pre>

      <!-- 编辑：文本框 -->
      <el-input
        v-else
        v-model="editText"
        type="textarea"
        :rows="20"
        class="json-edit"
      />
    </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useModelStore } from '@/store/model'
import { ElMessage } from 'element-plus'

const modelStore = useModelStore()

// 本地状态用于选择器
// const selectedModel = ref<string>('')
const provider = ref<string | null>('')
const model_id = ref<string>('')

// 模型配置编辑状态
const editing = ref(false)
const editText = ref('')

function onProviderChange(key: string) {
  model_id.value= ""
  modelStore.fetchModelsbyProvider(key)
}
const handleApply = async () => {
  if (!provider.value || !model_id.value) return
  try {
    const result = await modelStore.switchModel(provider.value, model_id.value)
    if (result.success) {
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
      // 如果切换失败，重置选择器为当前模型
      if (modelStore.currentModel) {
        provider.value = modelStore.currentProvider || ''
        model_id.value = modelStore.currentModel.id
      }
    }
  } catch (error) {
    ElMessage.error('切换模型时发生错误')
    // 如果切换失败，重置选择器为当前模型
    if (modelStore.currentModel) {
      provider.value = modelStore.currentProvider || ''
      model_id.value = modelStore.currentModel.id
    }
  }
}

// 初始化数据
onMounted(async () => {
  // 先获取可用模型列表
  // await modelStore.fetchAvailableModels()
  modelStore.fetchProviders()
  
  // 再获取当前模型
  modelStore.fetchCurrentModel().then(() => {
    if (modelStore.currentModel) {
      provider.value = modelStore.currentProvider || ''
      model_id.value = modelStore.currentModel.id
    }
  })
  
  // 获取模型配置
  modelStore.fetchModelConfigs()
  if (modelStore.currentProvider) {
    modelStore.fetchModelsbyProvider(modelStore.currentProvider)
  }
})

/* 进入编辑 */
function toggleEdit() {
  editing.value = !editing.value
  if (editing.value) {
    // 把当前配置转成字符串丢进文本框
    editText.value = JSON.stringify(modelStore.configs || {}, null, 2)
  }
}

/* 保存配置 */
async function saveConfigs() {
  try {
    // 1. 解析文本框内容
    const newConfigs = JSON.parse(editText.value)
    // 2. 更新 store 中的配置
    modelStore.configs = newConfigs
    // 3. 调用后端保存
    const result = await modelStore.updateModelConfigs()
    if (result.success) {
      ElMessage.success(result.message)
      editing.value = false
    } else {
      ElMessage.error(result.message)
    }
  } catch (e: any) {
    ElMessage.error('保存失败：' + (e.message || e))
  }
}

/* 高亮、复制 */
const highlightedConfigs = computed(() => {
  const json = JSON.stringify(modelStore.configs || {}, null, 2)
  return json
    .replace(/"([^"\\]|\\.)*"(\s*:)?/g, '<span class="json-key">$&</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="json-bool">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="json-number">$1</span>')
})

async function handleCopy() {
  await navigator.clipboard.writeText(JSON.stringify(modelStore.configs || {}, null, 2))
  ElMessage.success('已复制')
}

</script>

<style scoped>
.llm-container {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%; /* 改为100%以适应父容器高度 */
  padding: 30px; /* 统一内边距 */
  box-sizing: border-box; /* 包含padding和border在高度计算中 */
  overflow: hidden; /* 防止容器本身出现滚动条 */
}
.model-selector {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 左对齐 */
  flex-shrink: 0; /* 防止收缩 */
}

.selector-pair {
  display: flex;
  align-items: end;
  gap: 15px;
  flex-wrap: wrap; /* 允许换行 */
  margin-bottom: 20px; /* 给选择器组底部留出空间 */
}

.selector-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 左对齐 */
  margin: 0;
  min-width: 200px; /* 为选择器设置最小宽度 */
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

.selector-label {
  margin-bottom: 5px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  text-align: left;
  width: 100%;
}

.model-select {
  min-width: 200px;
  width: 200px; /* 固定宽度，防止拉伸 */
}

.apply-btn {
  margin-bottom: 2px; /* Align with the bottom of the selectors */
  align-self: flex-end; /* 底部对齐 */
  margin-left: 15px; /* 为应用按钮留出左边距 */
}

.model-option {
  display: flex;
  flex-direction: column;
}

.model-name {
  font-weight: bold;
}

.model-description {
  font-size: 0.8em;
  color: #909399;
  margin-top: 2px;
}

/* 模型配置编辑区域样式 */
.model-config-container {
  box-sizing: border-box;
  margin-top: 20px; /* 调整上方间距 */
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fafafa;
  padding: 12px;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', monospace;
  flex: 1; /* 占满剩余空间 */
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许内容溢出时显示滚动条 */
  overflow: hidden; /* 防止容器本身出现滚动条 */
}

.config-header {
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center; /* 垂直居中对齐 */
  margin-bottom: 8px;
}

.config-header h3 {
  margin: 0;
  color: #606266; /* 设置标题颜色 */
  font-size: 14px;
}

.json-config {
  box-sizing: border-box;
  margin: 0;
  overflow: auto;
  flex: 1; /* 占满剩余空间 */
  min-height: 0; /* 允许内容溢出时显示滚动条 */
}

/* 简易高亮颜色 */
.json-key   { color: #096; }
.json-number { color: #07c; }
.json-bool  { color: #e66; }
.json-edit {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  flex: 1; /* 占满剩余空间 */
  min-height: 0; /* 允许内容溢出时显示滚动条 */
}
</style>
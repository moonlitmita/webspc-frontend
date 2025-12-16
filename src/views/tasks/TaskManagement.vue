<template>
  <div class="task-container">
    <div class="header">
      <h2>周期性任务管理</h2>
      <el-button type="primary" @click="openAddDialog">添加任务</el-button>
    </div>
    
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="任务名称">
          <el-input v-model="searchForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchTasks">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <div class="table-container">
      <div class="my-table">
        <div class="table-content">
          <el-table :data="taskList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="任务名称" />
            <el-table-column prop="project_id" label="项目ID" />
            <el-table-column prop="task" label="任务函数" />
            <el-table-column prop="schedule_type" label="调度类型" :formatter="formatScheduleType" />
            <el-table-column prop="schedule_value" label="调度参数" show-overflow-tooltip />
            <el-table-column prop="enabled" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'danger'">
                  {{ row.enabled ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="add_date" label="创建时间" width="180" />
            <el-table-column label="操作" width="280">
              <template #default="{ row }">
                <el-button size="small" @click="toggleTask(row)"> 
                  {{ row.enabled ? '禁用' : '启用' }}
                </el-button>
                <el-button size="small" type="primary" @click="openEditDialog(row)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="deleteTask(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
    <div class="pager">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[5, 10, 15, 20]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 添加/编辑任务对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      :before-close="closeDialog"
    >
      <el-form 
        :model="taskForm" 
        :rules="taskRules" 
        ref="taskFormRef" 
        label-width="120px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>

         <el-form-item label="项目ID" prop="project_id">
          <el-input v-model="taskForm.project_id" placeholder="请输入项目ID" />
        </el-form-item>
        
        <el-form-item label="任务函数路径" prop="task">
          <el-input v-model="taskForm.task" placeholder="请输入任务函数路径" />
        </el-form-item>
        
        <el-form-item label="是否启用" prop="enabled">
          <el-switch 
            v-model="taskForm.enabled" 
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        
        <el-form-item label="调度类型" prop="schedule_type">
          <el-select v-model="taskForm.schedule_type" placeholder="请选择调度类型">
            <el-option label="间隔调度" value="interval" />
            <!-- <el-option label="Cron调度" value="crontab" /> -->
          </el-select>
        </el-form-item>
        
        <el-form-item 
          v-if="taskForm.schedule_type === 'interval'" 
          label="间隔参数" 
          prop="schedule_value"
        >
          <el-input 
            v-model="taskForm.schedule_value" 
            placeholder="请输入间隔值（如：{'every': 30, 'period': 'seconds'}）"
          />
        </el-form-item>
        
        <el-form-item 
          v-else-if="taskForm.schedule_type === 'crontab'" 
          label="Cron参数" 
          prop="schedule_value"
        >
          <el-input 
            v-model="taskForm.schedule_value" 
            placeholder="请输入Cron表达式（如：{'minute': '*/30', 'hour': '*', 'day_of_week': '*'}）"
          />
        </el-form-item>
        
        <el-form-item label="任务参数" prop="args">
          <el-input 
            v-model="taskForm.args" 
            type="textarea"
            :rows="3"
            placeholder="请输入任务参数（JSON格式，可选）"
          />
        </el-form-item>
        
        <el-form-item label="任务关键字参数" prop="kwargs">
          <el-input 
            v-model="taskForm.kwargs" 
            type="textarea"
            :rows="3"
            placeholder="请输入任务关键字参数（JSON格式，可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="confirmTask">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 刷新调度配置按钮 -->
    <div class="refresh-btn">
      <el-button type="warning" @click="refreshSchedules">刷新调度配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTaskStore } from '../../store/task'
import type { PeriodicTask } from '../../api/taskApi'

// Store
const taskStore = useTaskStore()

// Data
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const taskFormRef = ref()
const currentPage = ref(1)
const pageSize = ref(10)

// Forms
const taskForm = reactive({
  id: 0,
  name: '',
  project_id: '',
  task: '',
  enabled: true,
  schedule_type: 'interval' as 'interval' | 'crontab',
  schedule_value: '',
  args: '',
  kwargs: ''
})

const searchForm = reactive({
  name: ''
})

// Rules
const taskRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ],
  project_id: [
    { required: true, message: '请输入项目ID', trigger: 'blur' }
  ],
  task: [
    { required: true, message: '请输入任务函数路径', trigger: 'blur' }
  ],
  schedule_type: [
    { required: true, message: '请选择调度类型', trigger: 'change' }
  ],
  schedule_value: [
    { required: true, message: '请输入调度参数', trigger: 'blur' }
  ]
}

// 使用 store 中的数据，分页和搜索逻辑已在后端处理
const taskList = computed(() => taskStore.taskList || [])

const total = computed(() => taskStore.config.total || 0)

const dialogTitle = computed(() => isEdit.value ? '编辑任务' : '添加任务')

// Methods
const loadTasks = async () => {
  loading.value = true
  try {
    await taskStore.getTasks()
  } catch (error) {
    console.error('Failed to load tasks:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (task: PeriodicTask) => {
  isEdit.value = true
  // Fill the form with task data
  Object.assign(taskForm, {
    id: task.id,
    name: task.name,
    project_id: task.project_id,
    task: task.task,
    enabled: task.enabled,
    schedule_type: task.schedule_type,
    schedule_value: task.schedule_value,
    args: task.args || '',
    kwargs: task.kwargs || ''
  })
  dialogVisible.value = true
}

const resetForm = () => {
  Object.assign(taskForm, {
    id: 0,
    name: '',
    project_id: '',
    task: '',
    enabled: true,
    schedule_type: 'interval',
    schedule_value: '',
    args: '',
    kwargs: ''
  })
}

const confirmTask = async () => {
  try {
    await taskFormRef.value.validate()
    
    // Validate JSON fields
    if (taskForm.args && !isValidJSON(taskForm.args)) {
      ElMessage.error('任务参数不是有效的JSON格式')
      return
    }
    
    if (taskForm.kwargs && !isValidJSON(taskForm.kwargs)) {
      ElMessage.error('任务关键字参数不是有效的JSON格式')
      return
    }
    
    const params = {
      name: taskForm.name,
      project_id: taskForm.project_id,
      task: taskForm.task,
      enabled: taskForm.enabled,
      schedule_type: taskForm.schedule_type,
      schedule_value: JSON.parse(taskForm.schedule_value),
      args: taskForm.args ? JSON.parse(taskForm.args) : null,
      kwargs: taskForm.kwargs ? JSON.parse(taskForm.kwargs) : null
    }
    
    if (isEdit.value) {
      await taskStore.updateTask(taskForm.id, params)
      ElMessage.success('任务更新成功')
    } else {
      await taskStore.addTask(params)
      ElMessage.success('任务添加成功')
    }
    
    dialogVisible.value = false
    await loadTasks()
  } catch (error) {
    console.error('Task operation failed:', error)
    if (typeof error === 'object' && error !== null && 'validator' in error) {
      // Validation error handled by element-plus
      return
    }
    ElMessage.error('操作失败')
  }
}

const deleteTask = async (task: PeriodicTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${task.name}" 吗？`,
      '删除任务',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await taskStore.deleteTask(task.id)
    ElMessage.success('任务删除成功')
    await loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete task:', error)
      ElMessage.error('删除任务失败')
    }
  }
}

const toggleTask = async (task: PeriodicTask) => {
  try {
    await taskStore.toggleTask(task.id)
    ElMessage.success(`任务已${task.enabled ? '启用' : '禁用'}`)
    // The store will update the local task list
  } catch (error) {
    console.error('Failed to toggle task:', error)
    ElMessage.error('切换任务状态失败')
  }
}

const refreshSchedules = async () => {
  try {
    await taskStore.refreshSchedules()
    ElMessage.success('任务调度配置已刷新')
  } catch (error) {
    console.error('Failed to refresh schedules:', error)
    ElMessage.error('刷新调度配置失败')
  }
}

const closeDialog = () => {
  dialogVisible.value = false
  resetForm()
}

const searchTasks = async () => {
  // Update search info in store and reload tasks
  taskStore.config.searchInfo = searchForm.name
  taskStore.config.page = 1 // Reset to first page when searching
  await loadTasks()
}

const resetSearch = async () => {
  searchForm.name = ''
  taskStore.config.searchInfo = ''
  taskStore.config.page = 1 // Reset to first page when resetting search
  await loadTasks()
}

const handleSizeChange = async (size: number) => {
  taskStore.config.pageSize = size
  taskStore.config.page = 1 // Reset to first page when page size changes
  await loadTasks()
}

const handleCurrentChange = async (page: number) => {
  taskStore.config.page = page
  await loadTasks()
}

// const formatScheduleType = (row: PeriodicTask) => {
//   return row.schedule_type === 'interval' ? '间隔调度' : 'Cron调度'
// }

//目前只有间隔调度，定时调度暂未开启
const CRON_ENABLED = false   // 暂时写死，后期可换成响应式数据

const formatScheduleType = (row: PeriodicTask): string => {
  // 如果 crontab 没启用，一律显示“间隔调度”
  if (!CRON_ENABLED) return '间隔调度'

  // 正常情况按真实值显示
  return row.schedule_type === 'interval' ? '间隔调度' : 'Cron调度'
}

const isValidJSON = (str: string) => {
  try {
    JSON.parse(str)
    return true
  } catch (error) {
    return false
  }
}

// Lifecycle
onMounted(async () => {
  await loadTasks()
})
</script>

<style scoped>
.task-container {
  padding: 20px;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .search-card {
    margin-bottom: 20px;
  }

  .table-container {
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    .my-table {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      .table-content {
        flex-shrink: 1;
        flex-grow: 1;
        flex-basis: auto;
        overflow: auto;
        display: flex;
        flex-direction: column;
      }
      .pager {
        height: 32px;
        flex-shrink: 0;
      }
    }
  }
}

.refresh-btn {
  margin-top: 20px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

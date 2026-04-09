/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="data-container">
    <div class="data-header">
      <div class="add">
        <el-button type="primary" @click="handleAdd" v-if="showItem">+单个新增</el-button>
      </div>
      <div class="addBatch">
        <el-upload
          ref="uploadRef"
          action="#"
          :http-request="uploadFile"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :limit="1"
          v-model:file-list="fileList"
          accept=".xlsx, .xls"
          :auto-upload="true"
        >
          <el-button type="primary" v-if="showItem">+批量新增</el-button>
        </el-upload>
      </div>
      <div class="filter">
        <el-form :inline="true">
          <el-form-item label="开始日期">
            <el-date-picker v-model="startDate" type="date" placeholder="开始日期"></el-date-picker>
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker v-model="endDate" type="date" placeholder = "结束日期"></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="filterByDateRange">筛选</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="table-container">
      <div class="my-table">
        <div class="table-content">
          <el-table :data="lineStore.chartDataList_pagination" v-loading="loading">
            <el-table-column type="index" :index="getIndex" label="序号" width="60"></el-table-column>
            <el-table-column prop="samples" label="样本">
              <template v-slot:default="scope">
                <div class="sample-container">
                  <div v-for="(value, key) in scope.row.samples" :key="key">
                    {{ value }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="add_date" label="日期" width="160"></el-table-column>
            <el-table-column fixed="right" label="操作" width="150" v-if="showItem">
              <template #default="scope">
                <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="pager">
          <div class="demo-pagination-block">
            <el-pagination 
            v-model:current-page="lineStore.config.page"
            v-model:page-size="lineStore.config.pageSize"
            :page-sizes = "[10,50,100,150]"
            layout="total,sizes,prev,pager,next,jumper" 
            :total="lineStore.config.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="action=='add'?'新增数据': '编辑数据'"
      width="45%"
      :before-close="handleClose"
    >
      <el-form :inline="true" :model="formChartData" ref="chartDataForm">
        <el-row>
          <el-col :span="24">
            <el-form-item label="项目ID">
              <el-input v-model="formChartData.project_id" disabled />
            </el-form-item>
          </el-col>
          <el-col v-for="item in formItems" :span="12" :key="item">
            <el-form-item :label="`N${item}`" :prop="`n${item}`" :rules="getFormRules(item)">
              <el-input v-model="formChartData[`n${item}`]" :placeholder="`请N${item}数据`" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="onSubmit">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, ref, reactive, nextTick, computed, watchEffect} from 'vue'
import type { Ref } from 'vue'
import type { Data } from '../../../api/mainApi'
import { ElMessageBox, ElMessage, ElForm, ElButton } from 'element-plus'
import type { UploadInstance, UploadUserFile, UploadRawFile } from 'element-plus'
import { useLineStore } from '../../../store/lineData'

interface formChartData {
  id: string
  project_id: string
  [key: string]: number | string
 }
const lineStore = useLineStore()
const getAll = false
const loading = ref(false)
const startDate = ref<Date | string | null>(null)
const endDate = ref<Date | string | null>(null)
const fileList = ref<UploadUserFile[]>([])
const uploadRef = ref<UploadInstance>()
const parseNumber = (value: string) => {
  return parseFloat(value)
}
const chartDataForm: Ref<typeof ElForm | null> = ref(null)
const dialogVisible = ref(false)
const sampleSize = lineStore.sampleSize
const formItems = computed(() => {
  return Array.from(Array(sampleSize), (_, index) => index + 1);
})
const showItem = computed(() => {
  return lineStore.dataCollectionType !== "自动采集"
})

function getFormRules(item: number) {
  return [
    { required: true, message: `数据N${item}是必填项` },
  ]
}

const getIndex = (index: number) => {
  return (lineStore.config.page - 1) * lineStore.config.pageSize + index + 1
}

const handleSizeChange = (val: number) => {
  lineStore.config.pageSize = val
  lineStore.config.page = 1
  lineStore.loadData(false).finally(() => {
    loading.value = false
  })
}

const handleCurrentChange = (val: number) => {
  lineStore.config.page = val
  // startDate.value = null
  // endDate.value = null
  lineStore.loadData(false).finally(() => {
    loading.value = false
  })
}

// lineStore.loadData(false)

onMounted(()=>{
  lineStore.loadData(false).finally(() => {
    loading.value = false
  })
 })

const filterByDateRange = () => {
  lineStore.loadData(false).finally(() => {
    loading.value = false
  })
}

startDate.value = lineStore.config.startDate
endDate.value = lineStore.config.endDate

watchEffect(()=> {
  lineStore.config.startDate = startDate.value
  lineStore.config.endDate = endDate.value
})

const handleReset = () => {
  startDate.value = ''
  endDate.value = ''
  lineStore.loadData(false).finally(() => {
    loading.value = false
  })
}

const handleCancel = () => {
  dialogVisible.value=false
  chartDataForm.value?.resetFields()
}

const action = ref('add')
const handleEdit = (row: Data) => {
  action.value='edit'
  dialogVisible.value=true
  nextTick(()=>{ 
    formChartData.id = row.id
    formChartData.project_id = row.project_id
    for(let i = 0; i<row.samples.length; i++) {
      if(formChartData.hasOwnProperty(`n${i + 1}`)) {
        formChartData[`n${i+1}`] = row.samples[i]
      } else {
        console.log(`Property n${i+1} does not exist in formChartData `)
      }
    }
  })
}

const handleDelete = (row: Data)=> {
  ElMessageBox.confirm(
    '你确定要删除此数据吗？',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
    .then(() => {
      lineStore.deleteHomeData({
        id:row.id
      }).then(()=> {
        ElMessage({
        showClose:true,
        message: '删除成功！',
        type: "success"
        })
        lineStore.loadData(false).finally(() => {
          loading.value = false
        })
       })
    })
    .catch(() => {
      // catch error
    })
}

const handleAdd = ()=> {
  action.value='add'
  dialogVisible.value=true
}

const beforeUpload = (file: File)=> {
const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||  
  file.type === 'application/vnd.ms-excel'
const maxSizeMB = 10
const isLtMaxSize = file.size / 1024 / 1024 < maxSizeMB
  if(!isExcel) {
    ElMessage.error('文件只能是Excel格式!')
    return false
  }
  if(!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过${maxSizeMB}MB!`)
    return false
  }
  return true
}

const handleSuccess = ()=> {
  ElMessage.success('文件上传成功！')
}

const handleError = ()=> {
  ElMessage.error('文件上传失败！')
}

const handleFileChange = (uploadFile: File, uploadFiles: any)=> {
}

const uploadFile = async ()=> {
  try {
    if (!fileList.value[0].raw) {
      ElMessage.error('请选择文件后再上传！')
      return
    }

    let formData = new FormData()
    formData.append('dataType', 'batch')
    formData.append('file', fileList.value[0].raw as UploadRawFile)
    formData.append('project_id', lineStore.config.project_id)
    formData.append('sample_size', String(sampleSize))

    await lineStore.addHomeData(formData)

    ElMessage.success('文件上传成功！')
    lineStore.loadData(false)
    uploadRef.value!.clearFiles()
  } catch (error: any) {
    // 错误信息已经在拦截器中显示了
  }
}

const handleClose = (done:()=>void) => {
  ElMessageBox.confirm(
    '你确定要关闭此对话框吗？',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
    .then(() => {
      chartDataForm.value?.resetFields()
      done()
    })
    .catch(() => {
      // catch error
    })
}

const formChartData = reactive({}) as formChartData
function generateFormChartData<T extends number>(sampleSize: T) {
  formChartData.dataType = "single"
  formChartData.id = ""
  formChartData.add_date = ""
  formChartData.project_id = lineStore.config.project_id
  for(let i = 1; i<=sampleSize; i++) {
    formChartData[`n${i}`] = ""
  }
}

generateFormChartData(sampleSize)
const onSubmit = () => {
  chartDataForm.value?.validate((valid: Boolean)=>{
    for (let i=1; i<=sampleSize; i++) {
      formChartData[`n${i}`] = parseNumber(formChartData[`n${i}`] as string)
    }
    if(valid) {
      if(action.value=='add') {
        lineStore.addHomeData(formChartData).then(()=> {
          lineStore.loadData(false).finally(() => {
            loading.value = false
          })
        })
        chartDataForm.value?.resetFields()
        dialogVisible.value=false
      } else {
        let res = lineStore.editHomeData(formChartData)
        lineStore.editHomeData(formChartData).then(()=> {
          lineStore.loadData(false).finally(() => {
            loading.value = false
          })
        })
        chartDataForm.value?.resetFields()
        dialogVisible.value=false
      }
    } else {
      ElMessage({
        showClose: true,
        message: '请输入正确内容',
        type: 'error'
      })
    }
  })
}

</script>
<style lang='less' scoped>
.data-container {
  flex: 1;
  padding-top: 3px;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0; /* 重新添加，对于flex子项很重要 */
  .data-header{
    display:flex;
    flex-wrap: nowrap;
    height: 35px;
    justify-content:space-between;
    flex-shrink: 0;
    .add {
      flex: 1;
    }
    .addBatch {
      flex: 1
    }
    .filter {
      flex: 9;
      .el-form {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
  .table-container {
    flex: 1; /* 更明确的flex属性 */
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
        flex-basis: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        .sample-container {
          flex-shrink: 1;
          min-height: 0;
          display: flex;
          justify-content: space-between;
        }
      }
      .pager {
          height: 32px;
          flex-shrink: 0;
          background: #fff;
      }
    }
  }
}
</style>

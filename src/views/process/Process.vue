/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="process-container">
    <div class="process-header">
      <div class="add">
         <el-button type="primary" @click="handleAdd">+新增</el-button>
      </div>
      <el-form :inline="true" :model="formInline" @submit.native.prevent>
        <el-form-item label="请输入">
          <el-input v-model="formInline.keyword" placeholder="部门或制程名称" @keyup.enter.native="handleSearch"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-container">
      <div class="my-table">
        <div class="table-content">
          <el-table :data="processStore.processList_pagination" style="width: 100%">
            <el-table-column 
              v-for="item in tableLabel"
              :key="item.prop"
              :label="item.label"
              :prop="item.prop"
              :width="item.width?item.width:125"
            />
            <el-table-column fixed="right" label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="handleEdit(scope.row)">
                  <el-icon style="font-size: 13px; margin-right: 3px"><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button type="danger" size="small" @click="handleDelete(scope.row)">
                  <el-icon style="font-size: 13px; margin-right: 3px;"><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="pager">
          <el-pagination 
            v-model:current-page="processStore.config.page"
            v-model:page-size="processStore.config.pageSize"
            :page-sizes="[5,10,15,20]"
            @current-change="changePage"
            layout="total,sizes,prev,pager,next,jumper" 
            :total="processStore.config.total"
          />
        </div>
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="action=='add'?'新增制程': '编辑制程'"
      width="45%"
      :before-close="handleClose"
    >
      <el-form :inline="false" :model="formProcess" ref="processForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门名称" prop="dep" :rules="[
              {required:true,message:'部门名称是必填项'}
            ]">
            <el-select v-model="formProcess.dep" placeholder="请选择" style="width: 100%;">
              <el-option
                v-for="item in depOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
               />
            </el-select>
            </el-form-item>
          </el-col>
         <el-col :span="12">
           <el-form-item label="制程名称" prop="process" :rules="[
             {required:true,message:'制程名称是必填项'}
            ]">
             <el-input v-model="formProcess.process" placeholder="请输入制程名称" style="width: 100%;" />
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
import { onMounted,ref,reactive,nextTick, watchEffect, computed} from 'vue';
import type { Ref } from 'vue'
import type { Process }from '../../api/mainApi'
import {ElMessageBox,ElMessage,ElForm} from 'element-plus'
import { useProcessStore } from '../../store/process'
import { useDepStore } from '../../store/department'

const processStore = useProcessStore()
const depStore = useDepStore()

const processForm: Ref<typeof ElForm | null> = ref(null)
const dialogVisible = ref(false)
const tableLabel = reactive(
  [ 
    {
      prop: "id",
      label: "制程ID",
      width: "80"

    },
    {
      prop: "dep",
      label: "部门名称",
      width: "150"
    },
    {
      prop: "process",
      label: "制程名称",
      width: "150"
    },
    {
      prop: "add_date",
      label: "创建时间",
      width: "170"
    },
    {
      prop: "upd_date",
      label: "更新时间",
      width: "170"  
    }
  ]
)

onMounted(()=>{
  depStore.getDepData(true)
  processStore.getProcessData(false)
})
const fixedOption = {value: '', label: '请选择'}
const depOptions = computed(()=> {
  return [fixedOption].concat((depStore.depList_all || []).map((item)=>({
    value: item.dep,
    label: item.dep
   })))
})

const changePage= (page: number) =>{
  processStore.config.page=page
  processStore.getProcessData(false)
}

const formInline = reactive({
  keyword: ""
})
formInline.keyword = processStore.config.searchInfo
watchEffect(()=> {
  processStore.config.searchInfo = formInline.keyword
})

const handleSearch = ()=>{
  processStore.getProcessData(false)
}

const handleCancel = () => {
  dialogVisible.value=false
  processForm.value?.resetFields()
}

const action = ref('add')
const handleEdit = (row: Process) => {
  action.value='edit'
  dialogVisible.value=true
  depStore.getDepData(true)
  nextTick(()=>{ 
    Object.assign(formProcess,row)
  })
}

const handleDelete = (row: Process)=> {
  ElMessageBox.confirm(
    '你确定要删除此制程吗？',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
    .then(() => {
      processStore.deleteProcess({
        id:row.id
      }).then(()=> {
        ElMessage({
          showClose:true,
          message: '删除成功！',
          type: "success"
        })
        processStore.getProcessData(false)
      })
   })
   .catch(() => {
     // catch error
     ElMessage.error('删除失败')
   })
}

const handleAdd = ()=> {
  action.value='add'
  dialogVisible.value=true
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
      processForm.value?.resetFields()
      done()
   })
   .catch(() => {
     // catch error
   })
}

const formProcess = reactive({
  dep: "",
  process: ''
})
const onSubmit = () => {
  processForm.value?.validate((valid: Boolean)=>{
    if(valid) {
      if(action.value=='add') {
        processStore.addProcess(formProcess).then(()=> {
          processStore.getProcessData(false)
        })
        processForm.value?.resetFields()
        dialogVisible.value=false
      } else {
        let res = processStore.editProcess(formProcess)
        processStore.editProcess(formProcess).then(()=> {
          processStore.getProcessData(false)
        })
        processForm.value?.resetFields()
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
.process-container {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding-top: 5px;
  .process-header{
    display:flex;
    height: 35px;
    justify-content: space-between;
    .add {
      margin-left: 10px;
    }
  }
  .table-container {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    .my-table {
      flex: 1;
      display: flex;
      flex-direction: column;
      .pager {
        margin-top: 0px;
        margin-left: 5px;
      }
    }
  }
}
</style>
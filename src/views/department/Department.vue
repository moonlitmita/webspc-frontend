/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="dep-container">
    <div class="dep-header">
      <div class="add">
        <el-button type="primary" @click="handleAdd">+新增</el-button>
      </div>
      <el-form :inline="true" :model="formInline" @submit.native.prevent>
        <el-form-item label="请输入">
          <el-input v-model="formInline.keyword" placeholder="部门名称" @keyup.enter.native="handleSearch"></el-input>
        </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </el-form-item>
      </el-form>
    </div>
    <div class="table-container">
      <div class="my-table">
        <div class="table-content">
          <el-table :data="depStore.depList_pagination" style="width: 100%">
          <el-table-column 
            v-for="item in tableLabel"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            :width="item.width"
          />
          <el-table-column fixed="right" label="操作" width="150">
            <template #default="scope">
              <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
          </el-table>
        </div>
        <div class="pager">
          <el-pagination 
          v-model:current-page="depStore.config.page"
          v-model:page-size="depStore.config.pageSize"
          :page-sizes="[5,10,15,20]"
          @current-change="changePage"
          layout="total,sizes,prev,pager,next,jumper" 
          :total="depStore.config.total"
          />
        </div>
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="action=='add'?'新增部门': '编辑部门'"
      width="45%"
      :before-close="handleClose"
    >
      <el-form :inline="true" :model="formDep" ref="depForm">
        <el-row>
          <el-col :span="24">
              <el-form-item label="部门名称" prop="dep" :rules="[
                  {required:true,message:'部门名称是必填项'}
              ]">
              <el-input v-model="formDep.dep" placeholder="请输入部门名称" />
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
import { onMounted,ref,reactive,nextTick, watchEffect} from 'vue';
import type { Ref } from 'vue'
import { useDepStore } from '../../store/department'
import type { Dep } from '../../api/api.js'
import {ElMessageBox,ElMessage,ElForm} from 'element-plus'

const depStore = useDepStore()
const depForm: Ref<typeof ElForm | null> = ref(null)
const dialogVisible = ref(false)
const tableLabel = reactive(
  [   
    {
      prop: 'id',
      label: "部门ID",
      width: "80"
    },
    {
      prop: "dep",
      label: "部门名称",
      width: "150"
    },
    {
      prop: "add_date",
      label: "创建时间",
      width: "170",
    },
    {
      prop: "upd_date",
      label: "更新时间",
      width: "170"
    }
  ]
)
onMounted(()=>{
  depStore.getDepData(false)
})
const changePage= (page: number) =>{
  depStore.config.page=page
  depStore.getDepData(false)
}
const formInline = reactive({
  keyword: ""
})
formInline.keyword = depStore.config.dep
watchEffect(()=> {
  depStore.config.dep = formInline.keyword
})
const handleSearch = ()=>{
  depStore.getDepData(false)
}
const handleCancel = () => {
  dialogVisible.value=false
  depForm.value?.resetFields()
}
const action = ref('add')
const handleEdit = (row: Dep) => {
  action.value='edit'
  dialogVisible.value=true
  nextTick(()=>{ 
    Object.assign(formDep,row)
  })
}
const handleDelete = (row: Dep)=> {
  ElMessageBox.confirm(
  '你确定要删除此部门吗？',
  {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    center: true,
  })
  .then(() => {
    depStore.deleteDep({
    id:row.id
    }).then(()=> {
    ElMessage({
      showClose:true,
      message: '删除成功！',
      type: "success"
    })
    depStore.getDepData(false)
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
const handleClose = (done:()=>void) => {
  ElMessageBox.confirm(
    '你确定要关闭此对话框吗？',
    {
      customClass: 'my-message-box',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
    .then(() => {
      depForm.value?.resetFields()
      done()
    })
    .catch(() => {
      // catch error
    })
}
const formDep = reactive({
  dep: ""
})
const onSubmit = () => {
  depForm.value?.validate((valid: Boolean)=>{
    if(valid) {
      if(action.value=='add') {
        depStore.addDep(formDep).then(()=>{
          depStore.getDepData(false)
        })
        depForm.value?.resetFields()
        dialogVisible.value=false
      } else {
        depStore.editDep(formDep).then(()=> {
          depStore.getDepData(false)
        })
        depForm.value?.resetFields()
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
.dep-container {
  box-sizing: border-box;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  .dep-header{
    box-sizing: border-box;
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
      .tabel-content {
        flex: 1;
      }
      .pager {
        margin-top: 0px;
      }
    }
  }
}
</style>
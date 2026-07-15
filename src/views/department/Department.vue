/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="dep-container">
    <div class="header">
      <h2>部门管理</h2>
      <el-button type="primary" @click="handleAdd">添加部门</el-button>
    </div>

    <el-card class="search-card">
      <el-form :model="formInline" inline @submit.native.prevent>
        <el-form-item label="部门名称">
          <el-input v-model="formInline.keyword" placeholder="请输入部门名称" @keyup.enter.native="handleSearch"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <div class="table-container">
      <div class="my-table">
        <div class="table-content">
          <el-table :data="depStore.depList_pagination" style="width: 100%"
                    v-loading="loading">
          <el-table-column 
            v-for="item in tableLabel"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            :width="item.width"
          />
          <el-table-column fixed="right" label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEdit(scope.row)">
                <el-icon style="font-size: 13px; margin-right: 3px;"><Edit /></el-icon>
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
          v-model:current-page="depStore.config.page"
          v-model:page-size="depStore.config.pageSize"
          :page-sizes="[5,10,15,20]"
          layout="total,sizes,prev,pager,next,jumper" 
          :total="depStore.config.total"
          @size-change="handleSizeChange"
          @current-change="changePage"
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
import type { Dep } from '../../api/mainApi.js'
import {ElMessageBox,ElMessage,ElForm} from 'element-plus'

const depStore = useDepStore()
const depForm: Ref<typeof ElForm | null> = ref(null)
const loading = ref(false)
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
  loading.value = true
  depStore.getDepData(false).finally(() => {
    loading.value = false
  })
})

const handleSizeChange = (val: number) => {
  depStore.config.pageSize = val
  depStore.config.page = 1
  depStore.getDepData(false)
}

const changePage= (page: number) =>{
  loading.value = true
  depStore.config.page=page
  depStore.getDepData(false).finally(() => {
    loading.value = false
  })
}
const formInline = reactive({
  keyword: ""
})
formInline.keyword = depStore.config.dep
watchEffect(()=> {
  depStore.config.dep = formInline.keyword
})
const handleSearch = ()=>{
  loading.value = true
  depStore.getDepData(false).finally(() => {
    loading.value = false
  })
}

const handleReset = () => {
  formInline.keyword = ''
  depStore.config.dep = ''
  loading.value = true
  depStore.getDepData(false).finally(() => {
    loading.value = false
  })
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
    loading.value = true
    depStore.deleteDep({
    id:row.id
    }).then(()=> {
    ElMessage({
      showClose:true,
      message: '删除成功！',
      type: "success"
    })
    depStore.getDepData(false)
    }).finally(() => {
      loading.value = false
    })
  })
  .catch(() => {
    // catch error
    loading.value = false
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
      loading.value = true
      if(action.value=='add') {
        depStore.addDep(formDep).then(()=>{
          depStore.getDepData(false)
        }).finally(() => {
          loading.value = false
        })
        depForm.value?.resetFields()
        dialogVisible.value=false
      } else {
        depStore.editDep(formDep).then(()=> {
          depStore.getDepData(false)
        }).finally(() => {
          loading.value = false
        })
        depForm.value?.resetFields()
        dialogVisible.value=false
      }
    } else {
      loading.value = false
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
</style>
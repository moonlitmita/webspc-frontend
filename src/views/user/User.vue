/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="user-container">
    <div class="header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleAdd">添加用户</el-button>
    </div>

    <el-card class="search-card">
      <el-form :model="formInline" inline @submit.native.prevent>
        <el-form-item label="用户名">
          <el-input v-model="formInline.keyword" placeholder="请输入用户名" @keyup.enter.native="handleSearch" />
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
          <el-table :data="userStore.userList" style="width: 100%"
                    v-loading="loading">
            <el-table-column
              v-for="item in tableLabel"
              :key="item.prop"
              :label="item.label"
              :prop="item.prop"
              :width="item.width?item.width:150"
              show-overflow-tooltip
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
          <el-pagination class="emo-pagination-block"
          v-model:current-page="userStore.config.page"
          v-model:page-size="userStore.config.pageSize"
          :page-sizes="[5,10,15,20]"
          layout="total,sizes,prev,pager,next,jumper"
          :total="userStore.config.total"
          @size-change="handleSizeChange"
          @current-change="changePage"
        />
        </div>
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="action=='add'?'新增用户': '编辑用户'"
      width="50%"
      :before-close="handleClose"
    >
      <el-form :inline="false" :model="formUser" ref="userForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realname" :rules="[
              {required:true,message:'姓名是必填项'}
            ]">
              <el-input v-model="formUser.realname" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender" 
              :rules="[{required:true,message:'性别是必填项'}]"
            >
              <el-select v-model="formUser.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option label="男" value="1" />
                <el-option label="女" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="dep"
              :rules="[{required: true,message:'部门是必填项'}]"
            >
              <el-select v-model="formUser.dep" class="m-2" placeholder="请选择" size="large" style="width: 100%;">
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
            <el-form-item label="用户名" prop="username" :rules="[
              {required:true,message:'用户名是必填项'}]"
            >
              <el-input v-model="formUser.username" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password" 
              :rules="[{required:true,message:'密码是必填项'}]"
            >
              <el-input v-model="formUser.password" placeholder="请输入密码" :disabled="isPasswordDisabled"/>
            </el-form-item>   
          </el-col>
          <el-col :span="12">
            <el-form-item label="超级管理员" prop="is_super_user"
              :rules="[{required:true,message:'超级管理员是必填项'}]"
            >
              <el-select v-model="formUser.is_super_user" placeholder="请选择" style="width: 100%;">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门管理员" prop="is_staff"
              :rules="[{required:true,message:'部门管理员是必填项'}]"
            >
              <el-select v-model="formUser.is_staff" placeholder="请选择" style="width: 100%;">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
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
import { onMounted,ref,reactive,nextTick, computed, watchEffect } from 'vue'
import type { Ref } from 'vue'
import type { User } from '../../api/mainApi'
import {ElMessageBox,ElMessage,ElForm} from 'element-plus'
import { useUserStore } from '../../store/user'
import { useDepStore } from '../../store/department'

const userStore = useUserStore()
const depStore = useDepStore()
const loading = ref(false)
const userForm: Ref<typeof ElForm | null> = ref(null)
let isPasswordDisabled = ref(false)
const dialogVisible = ref(false)
const tableLabel = reactive(
  [   
    {
      prop: "id",
      label: "用户ID",
      width: '80'
    },
    {
      prop: "realname",
      label: "真实姓名",
      width: '80'
    },
    {
      prop: "gender",
      label: "性别",
      width: '60'
    },
    {
      prop: "username",
      label: "用户名",
      width: '80'
    },
    {
      prop: "dep",
      label: "部门",
      width: '80'
    },
    {
      prop: "is_super_user",
      label: "超级管理员",
      width: '70'
    },
    {
      prop: "is_staff",
      label: "部门管理员",
      width: '70'
    },
    {
      prop: "is_active",
      label: "活跃用户",
      width: '70'
    },
    {
      prop: "add_date",
      label: "创建时间",
      width: '100'
    },
    {
      prop: "upd_date",
      label: "更新时间",
      width: '100'
    }
  ]
)

onMounted(()=>{
  loading.value = true
  depStore.getDepData(true)
  userStore.getUserData().finally(() => {
    loading.value = false
  })
})

const handleSizeChange = (val: number) => {
  userStore.config.pageSize = val
  userStore.config.page = 1
  userStore.getUserData()
}

const changePage= (page: number) =>{
  loading.value = true
  userStore.config.page=page
  userStore.getUserData().finally(() => {
    loading.value = false
  })
}

const formInline = reactive({
  keyword: ""
})
formInline.keyword = userStore.config.searchInfo
const handleSearch = ()=>{
  loading.value = true
  userStore.config.searchInfo = formInline.keyword
  userStore.getUserData().finally(() => {
    loading.value = false
  })
}

const handleReset = () => {
  formInline.keyword = ''
  userStore.config.searchInfo = ''
  loading.value = true
  userStore.getUserData().finally(() => {
    loading.value = false
  })
}

watchEffect(()=> {
  userStore.config.searchInfo = formInline.keyword
})

const handleCancel = () => {
  dialogVisible.value=false
  userForm.value?.resetFields()
}
const action = ref('add')
const handleEdit = (row: User) => {
  console.log(row)
  action.value='edit'
  dialogVisible.value=true
  isPasswordDisabled.value = true
  nextTick(()=>{ 
    Object.assign(formUser,{...row,is_super_user: String(row.is_super_user),
      is_active: String(row.is_active),is_staff: String(row.is_staff)})
  })
}

const handleDelete = (row: User)=> {
  ElMessageBox.confirm(
    '你确定要删除此用户吗？',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
    .then(() => {
      loading.value = true
      userStore.deleteUser({
        id:row.id
      }).then(()=> {
        ElMessage({
          showClose:true,
          message: '删除成功！',
          type: "success"
        })
        userStore.getUserData()
      }).finally(() => {
        loading.value = false
      })
    })
    .catch(() => {
      // catch error
      loading.value = false
      ElMessage.error('删除失败')
    })
}

const handleAdd = ()=> {
  action.value='add'
  dialogVisible.value=true
  isPasswordDisabled.value = false
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
      userForm.value?.resetFields()
      done()
    })
    .catch(() => {
      // catch error
      ElMessage.error('关闭失败')
    })
}
const formUser = reactive({
  realname: "",
  gender: "",
  username: "",
  dep: "",
  password: "",
  is_super_user: "",
  is_active: "",
  is_staff: ""
})

const fixedOption = {value: '', label: '请选择'}
const depOptions = computed(()=> {
  return [fixedOption].concat((depStore.depList_all || []).map((item)=>({
    value: item.dep,
    label: item.dep
  })))
})

const onSubmit = () => {
  userForm.value?.validate((valid: Boolean)=>{
    if(valid) {
      loading.value = true
      if(action.value=='add') {
        userStore.addUser(formUser).then((res)=> {
          userStore.getUserData()
        }).finally(() => {
          loading.value = false
        })
        userForm.value?.resetFields()
        dialogVisible.value=false
      } else {
        userStore.editUser(formUser).then(()=> {
          userStore.getUserData()
        }).finally(() => {
          loading.value = false
        })
        userForm.value?.resetFields()
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
.user-container {
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
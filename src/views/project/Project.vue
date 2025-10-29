/* Copyright 2025-present Yu Wang. All Rights Reserved.

   Distributed under MIT license.
   See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
*/

<template>
  <div class="project-container">
    <div class="project-header">
      <div class="add">
        <el-button type="primary" @click="handleAdd">+新增</el-button>
      </div>
      <el-form :inline="true" :model="formInline" @submit.native.prevent>
        <el-form-item label="请输入">
          <el-input v-model="formInline.keyword" placeholder="部门，制程或项目名称" @keyup.enter.native="handleSearch"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="table-container">
      <div class="my-table">
        <div class="table-content">
          <el-table :data="projectStore.projectList" style="width: 100%">
            <el-table-column 
              v-for="item in tableLabel"
              :key="item.prop"
              :label="item.label"
              :prop="item.prop"
              :width="item.width"
            />
            <el-table-column fixed="right" label="跳转" width="80">
              <template #default="scope">
                <el-button size="small" @click="handleJump(scope.row)">
                  <el-icon style="font-size: 13px; margin-right: 3px;"><Histogram /></el-icon>
                  控制图
                </el-button>
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="handleEdit(scope.row)">
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
            v-model:current-page="projectStore.config.page"
            v-model:page-size="projectStore.config.pageSize"
            :page-sizes="[5,10,15,20]"
            @current-change="changePage"
            layout="total,sizes,prev,pager,next,jumper" 
            :total="projectStore.config.total"
          />
        </div>
      </div>
    </div>
    <el-dialog
      v-model="dialogVisible"
      :title="action=='add'?'新增项目': '编辑项目'"
      :lock-scroll=false
      width="55%"
      align-center
      :before-close="handleClose"
      class="my-dialog-full-width"
    >
      <el-form :inline="false" 
        :model="state.formProject" 
        ref="projectForm"
        :rules=state.rules
        label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="部门名称" prop="dep">
              <el-select v-model="state.formProject.dep" placeholder="请选择" size="large" @change="updateOptions" style="width: 100%;">
                <el-option
                  v-for="item in depOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="制程名称" prop="process">
              <el-select v-model="state.formProject.process" class="m-2" placeholder="请选择" style="width: 100%;">
                <el-option
                  v-for="item in filteredProcesses"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="产品名称" prop="product">
              <el-input v-model="state.formProject.product" placeholder="请输入产品名称" style="width: 100%;"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="项目名称" prop="project">
              <el-input v-model="state.formProject.project" placeholder="请输入项目名称" style="width: 100%;"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="子组容量" prop="sampleSize">
              <el-input v-model="state.formProject.sampleSize" placeholder="请输入子组容量" :disabled="isSampleSizeDisabled" style="width: 100%;"/>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数据采集类型" prop="dataCollectionType">
              <el-select v-model="state.formProject.dataCollectionType" class="m-2" placeholder="请选择" size="large" :disabled="isCollectionTypeDisabled" style="width: 100%;">
                <el-option
                  v-for="item in dataCollectionTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="控制图类型" prop="spcType1">
              <el-select v-model="state.formProject.spcType1" class="m-2" placeholder="请选择" size="large" style="width: 100%;">
                <el-option
                  v-for="item in state.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="控制图类型" prop="spcType2">
              <el-select v-model="state.formProject.spcType2" class="m-2" placeholder="请选择" size="large" style="width: 100%;">
                <el-option
                  v-for="item in state.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="控制图类型" prop="spcType3">
              <el-select v-model="state.formProject.spcType3" class="m-2" placeholder="请选择" size="large" style="width: 100%;">
                <el-option
                  v-for="item in state.options"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="公差上限" prop="USL">
              <el-input v-model="state.formProject.USL" placeholder="请输入公差上限" style="width: 100%;"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="公差下限" prop="LSL">
              <el-input v-model="state.formProject.LSL" placeholder="请输入公差下限" style="width: 100%;"/>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-checkbox-group class="vertical-checkbox-group" v-model="state.formProject.selectedChecks">
              <el-checkbox
                v-for="(item, index) in selectedItems"
                :key="item.value"
                :label="item.value"
           >
                {{ item.label }}
              </el-checkbox>
            </el-checkbox-group>
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
import { onMounted,ref,reactive,nextTick, watch, watchEffect} from 'vue'
import type { Ref } from 'vue'
import type { Project }from '../../api/mainApi'
import {ElMessageBox,ElMessage, ElForm } from 'element-plus'
import type { FormRules } from 'element-plus'
import { useProjectStore } from '../../store/project'
import router from '../../router/router';
import { useLineStore } from '../../store/lineData';
import { useDepStore } from '../../store/department';
import { useProcessStore } from '../../store/process';

const projectStore = useProjectStore()
const lineStore = useLineStore()
const depStore = useDepStore()
const processStore = useProcessStore()

const projectForm: Ref<typeof ElForm | null> = ref(null)
const dialogVisible = ref(false)
let isSampleSizeDisabled = ref(false)
let isCollectionTypeDisabled = ref(false)
const selectedItems = [
  {value: '1', label: '准则1: 点超控制限'},
  {value: '2', label: '准则2: 连续9点落在中心线同一侧'},
  {value: '3', label: '准则3: 连续6点递增或递减'},
  {value: '4', label: '准则4: 连续14点中相邻点升降交错'},
  {value: '5', label: '准则5: 连续3点中有2点落在中心线同一侧的B区之外'},
  {value: '6', label: '准则6: 连续5点中有4点落在中心线同一侧的C区之外'},
  {value: '7', label: '准则7: 连续15点落在C区之内'},
  {value: '8', label: '准则8: 连续8点落在中心线两侧,但无1点在C区之内'}
]

interface selectObject {
  value: string,
  label: string
}

type RuleForm = {
  sn: number
  dep: string
  process: string
  product: string
  project: string
  spcType1: string
  spcType2: string
  spcType3: string
  n: string
  USL: number
  LSL: number
}

const tableLabel = reactive(
  [   
    {
      prop: 'id',
      label: "项目ID",
      width: '60'
    },
    {
      prop: "dep",
      label: "部门",
      width: '60'
    },
    {
      prop: "process",
      label: "制程",
      width: '60'
    },
    {   
      prop: "product",
      label: "产品",
      width: '80'
    },
    {
      prop: "project",
      label: "项目",
      width: '90'
    },
    {
      prop: "spcType1",
      label: "类型1",
      width: '40'
    },
    {
      prop: "spcType2",
      label: "类型2",
      width: '40'
    },
    {
      prop: "spcType3",
      label: "类型3",
      width: '40'
    },
    {
      prop: "sampleSize",
      label: "子组容量",
      width: '40'
    },
    {
      prop: "USL",
      label: "公差上限",
      width: '40'
    },
    {
      prop: "LSL",
      label: "公差下限",
      width: '40'
    },
    {
      prop: "add_date",
      label: "创建时间",
      width: "110"
    },
    {
      prop: "upd_date",
      label: "更新时间",
      width: "110"
    }
  ]
)

const dataCollectionTypeOptions = [
  {
    value: '手动采集',
    label: '手动采集'
  },
  {
    value: '自动采集',
    label: '自动采集'
  }
]

const state = reactive({
  options:[
    {
      value: '',
      label: '请选择'
    },
    {
      value: 'Xbar',
      label: 'Xbar',
    },
    {
      value: 'MR',
      label: 'MR',
    },
    {
      value: 'R',
      label: 'R',
    },
    {
      value: 'I',
      label: 'I',
    }
  ],
  formProject: {
    //  id: 0,
    dep: '',
    process: '',
    product: '',
    project: '',
    spcType1: '',
    spcType2: '',
    spcType3: '',
    sampleSize: 1,
    USL: 0,
    LSL: 0,
    selectedChecks: ['1', '2', '3', '4', '5', '6', '7', '8'],
    dataCollectionType: ''
  },
  rules: <FormRules<RuleForm>> {
    dep:[{required:true,message:'部门名称是必填项'}],
    process: [{required:true,message:'制程名称是必填项'}],
    product: [{required:true,message:'产品名称是必填项'}],
    project: [{required:true,message:'项目名称是必填项'}],
    spcType1:[
      {required:true,message:'控制图类型1是必填项'},
      {validator: validateSpcType, trigger: 'change'}
    ],
    spcType2:[
      {required:false,message:'控制图类型2是必填项'},
      {validator: validateSpcType, trigger: 'change'}
    ],
    spcType3:[
      {required:false,message:'控制图类型3是必填项'},
      {validator: validateSpcType, trigger: 'change'}
    ],
    sampleSize:[
      {required:true,message:'子组容量是必填项'},
      { validator: validateN, trigger: 'blur' }
    ],
    dataCollectionType:[{required:true,message:'数据采集类型是必填项'}],
    USL:[{required:true,message:'控制上限是必填项'}],
    LSL:[{required:true,message:'控制下限是必填项'}],
  }
})

const depOptions = reactive((depStore.depList_all || []).map((item)=>({value: item.dep, label: item.dep})))
const filteredProcesses = ref<selectObject[]>([])
const depValue = ref(state.formProject.dep)

const updateOptions = ()=> {
  filteredProcesses.value = (processStore.processList_all || []).filter(process=> process.dep===state.formProject.dep).map(
    item=> ({
      value: item.process,
      label: item.process
    })
  )  
}

watch(depValue, (newValue)=> {
  updateOptions()
})

function validateN(rule: any, value: any, callback: any) {
  if (/^\d+$/.test(value)) {
    const num = parseInt(value, 10);
    if (num >= 1 && num <= 25) {
      callback();
    } else {
      callback(new Error('数据必须是1-25之间的整数'));
    }
  } else {
    callback(new Error('数据必须是1-25之间的整数'));
  }
}

function validateSpcType(rule: any, value: any, callback: any) {
  if (state.formProject.sampleSize === 1 && (value === "Xbar" || value === "R")) {
    callback(new Error("子组容量=1,Xbar或R不可选"));
  } else {
    callback();
  }      
}

onMounted(()=>{
  depStore.getDepData(true)
  processStore.getProcessData(true)
  projectStore.getProjectData()
})

const changePage= (page: number) =>{
  projectStore.config.page=page
  projectStore.getProjectData()
}

const formInline = reactive({
  keyword: ""
})

formInline.keyword = projectStore.config.searchInfo
watchEffect(()=> {
  projectStore.config.searchInfo = formInline.keyword
})
const handleSearch = ()=>{
  projectStore.config.searchInfo = formInline.keyword
  projectStore.getProjectData()
}

const handleCancel = () => {
  dialogVisible.value=false
  projectForm.value?.resetFields()
}

const action = ref('add')
const handleJump = (row: Project) => {
  const spcTypeArr = [row.spcType1,row.spcType2,row.spcType3].filter((str: string)=>str !== "")
  lineStore.spcType = spcTypeArr
  lineStore.process = row.process
  lineStore.product = row.product
  lineStore.config.project_id = row.id
  lineStore.projectName = row.project
  lineStore.sampleSize = row.sampleSize
  lineStore.USL = row.USL
  lineStore.LSL = row.LSL
  lineStore.selectedChecks = row.selectedChecks
  lineStore.dataCollectionType = row.dataCollectionType
  router.push({
    path: '/home'
  })
}

const handleEdit = (row: Project) => {
  action.value = 'edit'
  dialogVisible.value = true
  isSampleSizeDisabled.value = true
  isCollectionTypeDisabled.value = true
  nextTick(()=>{ 
    Object.assign(state.formProject, row)
   })
}

const handleDelete = (row: Project)=> {
  ElMessageBox.confirm(
    '你确定要删除此项目吗？',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    })
    .then(() => {
      projectStore.deleteProject({
        id:row.id
      }).then(()=> {
        ElMessage({
          showClose:true,
          message: '删除成功！',
          type: "success"
        })
      projectStore.getProjectData()
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
  isSampleSizeDisabled.value = false
  isCollectionTypeDisabled.value = false

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
      projectForm.value?.resetFields()
      done()
    })
    .catch(() => {
      // catch error
    })
}

const onSubmit = () => {
  projectForm.value?.validate((valid: Boolean)=>{
    if(valid) {
      if(action.value=='add') {
        projectStore.addProject(state.formProject).then(()=> {
          projectStore.getProjectData()
        })
        projectForm.value?.resetFields()
        dialogVisible.value=false
      } else {
        projectStore.editProject(state.formProject).then(()=> {
          projectStore.getProjectData()
        })
        projectForm.value?.resetFields()
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
.project-container {
  box-sizing: border-box;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding-top: 5px;
  .project-header {
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
        margin-left: 5px;
      }
    }
  }
}
.vertical-checkbox-group {
  display: flex;
  flex-direction: column;
}
</style>
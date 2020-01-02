<template>
  <Dialog @close="$emit('cancel', false)" :visible.sync="isShowDialog" :show-close="false" :fullscreen="isFullscreen" class="diagnosis-dialog" width="800px">
    <div slot="title" class="title-header">
      <span>{{titleDiagnosis}}</span>
      <span class="full-style" @click="isFullscreen=!isFullscreen" :title="!isFullscreen?'全屏':'退出全屏'">
        <i :class="!isFullscreen? 'el-icon-rank':'el-icon-sort'"></i>
      </span>
    </div>
    <div class="body-form">
      <Form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" label-position="left" class="demo-ruleForm" :hide-required-asterisk="true">
        <FormItem label="计划名称" prop="name">
          <Input v-model="ruleForm.name" style="width:300px"></Input>
        </FormItem>
        <FormItem label="计划模板" prop="region">
          <Select placeholder="请选择计划模板" v-model="ruleForm.region">
            <Option v-for="item in planTemplates" :label="item.name" :value="item._id" :key="item._id"></Option>
          </Select>
        </FormItem>
        <FormItem label="诊断项目" prop="type" class="type-formitem">
          <Checkbox label="全选" :indeterminate="isIndeterminate" @change="checkboxAll" v-model="itemTypesAll"></Checkbox>
          <CheckboxGroup v-model="ruleForm.type" @change="changeCheckbox">
            <Checkbox class="item-checkbox" v-for="item in itemTypes" :label="item.label" :key="item.label">{{item.name}}</Checkbox>
          </CheckboxGroup>
        </FormItem>
        <FormItem label="诊断范围">
          <div class="form-tree">
            <tree ref="tree" :treeData="treeData" :selectNode="selectNode" :showNode="showNode" :showCheckbox="true" @handlechecked="handlechecked">
              <template slot-scope="{ node }">
                <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
                {{node.name}}
              </template>
            </tree>
          </div>
        </FormItem>
      </Form>
    </div>
    <div slot="footer" class="dialog-footer">
      <Checkbox class="check-box" @change="showChange">仅显示已选设备</Checkbox>
      <div class="footer-count">{{equipmentNumber}}</div>
      <div class="content-null"></div>
      <Button @click="submitBtn('ruleForm')" :loading="subDiagnosisStatus">确 定</Button>
      <Button @click="cancel">取 消</Button>
    </div>
  </Dialog>
</template>
<script>
// import { getAssingedTree } from '@/http/diagConf/plan.js'
import { getNodeIcon } from '@/components/BStree/commonMethods.js'
import Tree from '@/components/BStree/Tree'
export default {
  name: 'PlanDialog',
  components: {
    Tree
  },
  props: {
    showDialog: {
      type: Boolean,
      default: false
    },
    titleDiagnosis: {
      type: String,
      default: '添加诊断计划'
    },
    odificationBack: {
      type: Object
    },
    selectTreeL: {
      type: Array,
      default: () => {
        return []
      }
    },
    treeData: {
      type: Object
    },
    planTemplates: {
      type: Array,
      default: () => {
        return []
      }
    },
    tableDataList: { // 父组件获得的诊断配置计划全部数据
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      subDiagnosisStatus: false,
      searchVal: '大华',
      isShow: false,
      isShowChange: false,
      equipmentNumber: 0, // 已选设备量
      selectNode: [],
      treeSelectedNodes: [],
      isFullscreen: false,
      ruleForm: {
        name: '',
        region: '',
        // type: ['sc', 'ac', 'vc', 'ab', 'sm', 'pf', 'nd', 'pc', 'ptz']
        type: ['sc', 'ac', 'vc', 'ab', 'sm', 'pf', 'nd', 'pc'] // 诊断配置项依据这个生成的
      },
      rules: {
        name: [
          { required: true, message: '请输入计划名称', trigger: 'blur' },
          { min: 1, max: 16, message: '长度在 1 到 16 个字符', trigger: 'change' }
        ],
        region: [
          { required: true, message: '请选择计划模板', trigger: 'change' }
        ],
        type: [
          { type: 'array', required: true, message: '请至少选择一个诊断项目', trigger: 'change' }
        ]
      },
      // 诊断项目
      itemTypes: [
        // { name: '移动帧测', label: 'md' },
        { name: '场景切换', label: 'sc' },
        { name: '清晰度异常', label: 'ac' },
        { name: '画面遮挡', label: 'vc' },
        { name: '亮度异常', label: 'ab' },
        { name: '信号缺失', label: 'sm' },
        { name: '画面冻结', label: 'pf' },
        { name: '噪声检测', label: 'nd' },
        { name: '偏色检测', label: 'pc' }
        // { name: '云台失控', label: 'ptz' }
      ],
      itemTypesAll: true, // 全选选定
      isIndeterminate: false, // 全选按钮效果
      isShowDialog: false
    }
  },
  methods: {
    handlechecked(val) {
      this.equipmentNumber = this.$refs['tree'].getSelectedNodes().filter(item => { return !item.isOrg }).length
    },
    // 显示已选设备
    showChange(val) {
      this.isShowChange = val
    },
    showNode(node) {
      if (this.isShowChange) { // 若显示已选设备
        if (node.isOrg) { // 节点是否显示
          return true
        } else { // 设备是否显示
          return this.$refs['tree'].getSelectedNodes().map(item => { return item._id }).includes(node._id)
        }
      } else { // 若显示显示所有设备
        return true
      }
    },
    hasChild(node) {
      if (node.children && node.children.length > 0) {
        for (let index = 0; index < node.children.length; index++) {
          if (node.children[index].children) {
            this.hasChild(node.children[index])
          } else {
            let show = this.$refs['tree'].getSelectedNodes().map(item => { return item._id }).includes(node._id)
            if (show) {
              return true
            }
          }
        }
      } else {
        return false
      }
    },
    // 关闭
    cancel() {
      this.$emit('cancel', false)
      this.isFullscreen = false
      this.$refs['ruleForm'].resetFields()
    },
    // 取消
    resetFields() {
      this.$refs['ruleForm'].resetFields()
    },
    // 确定
    submitBtn(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.subDiagnosisStatus = true
          this.$emit('submitDialog', { ruleForm: this.ruleForm, selectedNodes: this.$refs['tree'].getSelectedNodes() })
        } else {
          return false
        }
      })
    },
    // 全选
    checkboxAll(val) {
      let itemTypesitem = []
      this.itemTypes.forEach(item => {
        itemTypesitem.push(item.label)
      })
      this.ruleForm.type = val ? itemTypesitem : []
      this.isIndeterminate = false
    },
    // 多选
    changeCheckbox(value) {
      let checkedCount = value.length
      this.itemTypesAll = checkedCount === this.itemTypes.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < this.itemTypes.length
    },
    // 机构树图标
    getNodeIcon(item) {
      return getNodeIcon(item)
    }
  },
  watch: {
    showDialog() {
      if (this.titleDiagnosis !== '修改诊断计划') {
        this.ruleForm.name = ''
        // this.ruleForm.type = ['md', 'sc', 'ac', 'vc', 'ab', 'sm', 'pf', 'nd', 'pc', 'ptz']
        this.ruleForm.type = ['sc', 'ac', 'vc', 'ab', 'sm', 'pf', 'nd', 'pc']
        this.ruleForm.region = ''
      }
      this.isShowDialog = this.showDialog
    },
    titleDiagnosis() {
      if (this.titleDiagnosis === '修改诊断计划') {
        this.ruleForm.type = []
        this.ruleForm.name = this.odificationBack.name
        this.ruleForm.region = this.odificationBack.res1.split('-')[0]
        console.log(this.odificationBack, ' this.odificationBack')
        this.equipmentNumber = this.odificationBack.count
        this.odificationBack.para.forEach(item => {
          if (item.enable === 'enable') {
            this.ruleForm.type.push(item.name)
          }
        })
      } else {
        this.equipmentNumber = 0
      }
    },
    selectTreeL: {
      handler() {
        if (this.selectTreeL.length) {
          let checkedTreel = []
          this.selectTreeL.forEach(item => {
            checkedTreel.push(item.res1.split('-')[0])
          })
          this.selectNode = checkedTreel
        } else {
          this.selectNode = []
        }
      },
      deep: true
    }
  }
}
</script>
<style scoped lang='less'>
@import '../../../../assets/theme/common';
.diagnosis-dialog {
  display: flex;
  flex-direction: column;
}
.title-header {
  display: flex;
  justify-content: space-between;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 100px;
}
.footer-count {
  margin-left: 5px;
  background: @dialog-footer-count-background;
  border-radius: 40%;
  border: 1px solid #fff;
  padding: 5px;
}
.content-null {
  flex: 1;
}
.form-tree {
  border: 1px solid @input-border-color;
  width: 600px;
  height: 20vh;
  min-height: 200px;
  overflow: auto;
}
.body-form {
  padding: 0px 10px;
}
.item-checkbox {
  width: 150px;
}
</style>

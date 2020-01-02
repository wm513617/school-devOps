<template>
  <Dialog @close="$emit('cancel', false)" :visible.sync="isShowDialog" v-if="isShowDialog" :show-close="false" :fullscreen="isFullscreen" class="diagnosis-dialog" width="800px">
    <div slot="title" class="title-header">
      <span>{{titleDiagnosis}}</span>
      <span class="full-style" @click="isFullscreen=!isFullscreen" :title="!isFullscreen?'全屏':'退出全屏'">
        <i :class="!isFullscreen? 'el-icon-rank':'el-icon-sort'"></i>
      </span>
    </div>
    <div class="body-form">
      <Form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" label-position="left" class="demo-ruleForm" :hide-required-asterisk="true">
        <FormItem label="添加人" prop="name">
          <Input v-model="ruleForm.name" style="width:300px" :disabled="true"></Input>
        </FormItem>
        <FormItem label="添加时间" prop="dialogTime">
          <Input v-model="dialogTime" style="width:300px" :disabled="true"></Input>
        </FormItem>
        <FormItem label="类型" prop="type">
          <Select placeholder="请选择计划模板" v-model="ruleForm.type">
            <Option v-for="item in itemTemplates" :label="item.label" :value="item.value" :key="item.value"></Option>
          </Select>
        </FormItem>
        <FormItem label="原因" prop="mark">
          <Input type="textarea" v-model="ruleForm.mark" style="width:600px"></Input>
        </FormItem>
        <FormItem label="选择设备">
          <Input v-model="searchVal" style="width:300px" suffix-icon="el-icon-search" size="small" placeholder="请输入通道名称"></Input>
          <div class="form-tree">
             <Tree ref="devTree" :data="treeData" show-checkbox node-key="_id" :default-expanded-keys="expandedKeys" :props="defaultProps" :filter-node-method="filterNode" @check-change="handlechecked" class="dialog-formitem-tree">
              <span slot-scope="{ node, data }">
                 <i class="iconfont" :class="[getNodeIcon(data).class]" :title="getNodeIcon(data).title"></i>
                <span>{{ node.label }}</span>
              </span>
            </Tree>
            <!-- <Tree ref="tree" :treeData="treeData" :showNode="showNode" :showCheckbox="true" @handlechecked="handlechecked">
              <template slot-scope="{ node }">
                <i class="iconfont" :class="[getNodeIcon(node).class]" :title="getNodeIcon(node).title"></i>
                {{node.name}}
              </template>
            </Tree> -->
          </div>
        </FormItem>
      </Form>
    </div>
    <div slot="footer" class="dialog-footer">
      <Checkbox class="check-box" @change="showChange">仅显示已选设备</Checkbox>
      <div class="footer-count">{{equipmentNumber}}</div>
      <div class="content-null"></div>
      <Button @click="submitBtn('ruleForm')">确 定</Button>
      <Button @click="cancel">取 消</Button>
    </div>
  </Dialog>
</template>
<script>
import { getNodeIcon } from '@/components/BStree/commonMethods.js'
// import Tree from '@/components/BStree/Tree'
import { mapState } from 'vuex'
import { rtspUrl } from '../rtspUrl'
export default {
  name: 'PlanDialog',
  components: {
    // Tree
  },
  props: {
    showDialog: {
      type: Boolean,
      default: false
    },
    titleDiagnosis: {
      type: String,
      default: '添加白名单'
    },
    dialogTime: {
      type: String,
      default: '2019-01-14 13:00:05'
    },
    treeData: {
      type: Array
    }
  },
  data() {
    return {
      isShowChange: false,
      equipmentNumber: 0,
      treeSelectedNodes: [],
      isFullscreen: false,
      ruleForm: {
        name: 'admin',
        type: '诊断白名单',
        mark: ''
      },
      rules: {
        mark: [
          { min: 0, max: 512, message: '长度在 0 到 512 个字符', trigger: 'change' }
        ]
      },
      // 类型
      itemTemplates: [
        { label: '诊断白名单', value: '诊断白名单' }
      ],
      // treeData: {}, // 机构树数据
      isShowDialog: false,
      searchVal: '',
      defaultProps: { // 机构树对应字段
        children: 'children',
        label: 'name'
      }
    }
  },
  computed: {
    ...mapState({
      terraceIp: (state) => state.terraceIp // 校园平台ip 诊断流地址使用
    }),
    expandedKeys() {
      if (this.treeData.length !== 0) {
        return [this.treeData[0]._id]
      } else {
        return []
      }
    }
  },
  methods: {
    /* getSelectedNodes(val) {
      this.treeSelectedNodes = val
      console.log(val, 999989)
    }, */
    // 关闭
    handlechecked(val) {
      this.equipmentNumber = this.$refs.devTree.getCheckedNodes().filter(item => { return !item.isOrg }).length
      // console.log(checkedNodes, checkedNodes.length)
      // this.equipmentNumber = this.$refs['tree'].getSelectedNodes().filter(item => { return !item.isOrg }).length
    },
    showNode(node) {
      if (node.isOrg) {
        return true
      } else {
        if (this.searchVal && this.isShowChange) {
          let reg = new RegExp(this.searchVal)
          return this.$refs['tree'].getSelectedNodes().map(item => { return item._id }).includes(node._id) && node.name.match(reg)
        } else if (this.isShowChange) {
          return this.$refs['tree'].getSelectedNodes().map(item => { return item._id }).includes(node._id)
        } else if (this.searchVal) {
          let reg = new RegExp(this.searchVal)
          return node.name.match(reg)
        } else {
          return true
        }
      }
    },
    filterNode(value, data) { // 机构树搜索
      if (!value) return true
      return data.name.indexOf(value) !== -1
    },
    showChange(val) {
      this.isShowChange = val
    },
    emptyData() {
      this.ruleForm.mark = ''
      this.equipmentNumber = 0
      this.isFullscreen = false
    },
    cancel() {
      this.$emit('cancel', false)
      this.emptyData()
    },
    // 确定
    submitBtn(ruleForm) {
      let nodeList = []
      let requestList = []
      let selNode = this.$refs.devTree.getCheckedNodes()
      selNode.forEach(item => {
        if (!item.isOrg) {
          nodeList.push(item)
        }
      })
      nodeList.forEach(item => {
        if (item.eid) {
          requestList.push({ 'url': rtspUrl(item, this.terraceIp), 'operator': this.ruleForm.name, 'mark': this.ruleForm.mark, res1: `${item._id}-${item.chan}` })
        }
      })
      this.$refs[ruleForm].validate((valid) => {
        if (valid) {
          if (requestList.length) {
            this.$emit('submitDialog', requestList)
          } else {
            this.$notify({
              message: '请选择到设备节点',
              type: 'warning'
            })
          }
        } else {
          return false
        }
      })
    },
    // 机构树图标
    getNodeIcon(item) {
      return getNodeIcon(item)
    }
  },
  watch: {
    showDialog() {
      this.isShowDialog = this.showDialog
    },
    searchVal(val) {
      this.$refs.devTree.filter(val)
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
  max-width: 1000px;
  display: flex;
  justify-content: flex-end;
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
</style>
<style lang='less'>
  @import '../../../../assets/theme/common';
  .el-dialog {
    background: @table-body-gb-color;
    border-radius: 8px 8px 0 0;
    .el-dialog__header {
      color: @table-header-text-color;
    }
    .el-textarea__inner:focus {
      border-color: @input-border-color;
    }
    .el-button {
      color: @main-body-text-color;
      background: @btn_background_primary;
      &:hover {
        background: @primary-btn-hover-bg-color;
      }
    }
  }
  .el-popper {
    .popper__arrow {
      top: -7px;
      border-bottom-color: @input-border-color !important;
    }
  }
</style>

<template>
  <div class="diagnose-server-wrap" v-resize="resize" ref="main">
    <header class="header-wrap">
      <ul>
        <li><Button type="primary" icon="el-icon-plus" @click="addServer">添加</Button></li>
        <li><Button type="primary" icon="el-icon-edit" @click="editRServer">修改</Button></li>
        <li><Button type="primary" icon="el-icon-remove-outline" @click="removeServer">删除</Button></li>
        <li><Button type="primary" icon="el-icon-refresh" @click="refreshTable">刷新</Button></li>
      </ul>
    </header>
    <main class="main-wrap">
      <Table size="small" :data="serverTableData" :height="tableHeight" @selection-change="selectTable" highlight-current-row>
        <table-column width="55" type="selection"></table-column>
        <table-column label="序号" type="index" min-width="100" align="center"></table-column>
        <table-column label="服务器名称" prop="name" min-width="100" show-overflow-tooltip></table-column>
        <table-column label="IP地址" prop="ip" min-width="200"></table-column>
        <table-column label="端口" prop="port" min-width="150" align="center"></table-column>
        <table-column label="备注" prop="remark" min-width="200" align="center" show-overflow-tooltip></table-column>
      </Table>
    </main>
    <footer class="footer-page">
      <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="bscCount" background>
      </Pagination>
    </footer>
    <Dialog :title="modelTitle" width="520px" :visible="showServerModel" :show-close="false" @close="resetForm">
      <Form :model="serverObj" :rules="repiarRule" ref="ruleForm" label-position="left" label-width="96px" style="padding: 0 40px;">
        <FormItem label="服务器类型" prop="type">
          <Select class="form-input" placeholder="请选择设备类型" v-model="serverObj.type">
            <Option label="诊断服务器" value="诊断服务器"></Option>
          </Select>
        </FormItem>
        <FormItem label="名称" prop="name">
          <Input class="form-input" placeholder="请填写服务器名称" v-model="serverObj.name" />
        </FormItem>
        <FormItem label="IP地址" prop="ip" size="small">
          <!-- <Input class="form-input" placeholder="请填写服务器IP" v-model="serverObj.ip" /> -->
          <Bsipv4 class="form-input" v-model="serverObj.ip"></Bsipv4>
        </FormItem>
        <FormItem label="端口" prop="port">
          <Input class="form-input" placeholder="请填写服务器端口" v-model="serverObj.port" />
        </FormItem>
        <FormItem label="备注信息" prop="remark">
          <Input class="form-input" v-model="serverObj.remark" type="textarea" />
        </FormItem>
      </Form>
      <div slot="footer" class="dialog-footer">
        <Button :loading="loadingSave" @click="saveRepiar">确 定</Button>
        <Button @click="showServerModel = false">取 消</Button>
      </div>
    </Dialog>
  </div>
</template>

<script>
import { validateNames64, validateName128, validatePort, validateIp } from '../../business/assetsManage/validate.js'
import { getServerList, addServer, updateServer, delServer } from '@/http/diagnoseServer.api'
import Bsipv4 from '../../../components/BSIPV4'
export default {
  components: {
    Bsipv4
  },
  data() {
    return {
      loadingSave: false,
      serverTableData: [],
      selectTableRow: [],
      modelTitle: '添加服务器',
      tableHeight: '100%',
      showServerModel: false,
      serverObj: {
        type: '诊断服务器',
        name: '',
        ip: '',
        port: '8080',
        remark: ''
      },
      repiarRule: {
        name: [{ required: true, validator: validateNames64, trigger: 'change' }],
        ip: [{ required: true, validator: validateIp, trigger: 'change' }],
        port: [{ required: true, validator: validatePort, trigger: 'change' }],
        remark: [{ validator: validateName128, trigger: 'change' }]
      },
      bscCount: 0, // 数据总计条数
      page: 1, // 当前页
      limit: 100 // 页大小
    }
  },
  methods: {
    // 按钮相关
    addServer() { // 添加
      this.modelTitle = '添加服务器'
      this.serverObj.type = '诊断服务器'
      this.serverObj.name = ''
      this.serverObj.ip = ''
      this.serverObj.port = '8080'
      this.serverObj.remark = ''
      this.showServerModel = true
    },
    editRServer() { // 修改
      if (this.selectTableRow.length > 1) {
        return this.$notify.warning({
          message: '一次只能修改一个!'
        })
      } else if (this.selectTableRow.length < 1) {
        return this.$notify.warning({
          message: '请选择修改项!'
        })
      }
      this.modelTitle = '修改服务器'
      this.serverObj = JSON.parse(JSON.stringify(this.selectTableRow[0]))
      this.serverObj.type = '诊断服务器'
      this.showServerModel = true
    },
    removeServer() { // 删除
      if (this.selectTableRow.length === 0) {
        return this.$notify.warning({
          message: '请选择删除项!'
        })
      }
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idArr = this.selectTableRow.map(obj => { return obj._id })
        delServer(idArr).then(() => {
          this.getTableData()
          this.$notify.success({
            message: '删除成功'
          })
        }).catch(err => {
          this.$notify.error({
            message: '删除失败'
          })
          console.log('delServer', err)
        })
      })
    },
    refreshTable(showNotice) {
      this.selectTableRow = []
      getServerList().then(res => {
        this.bscCount = +res.headers['x-bsc-count']
        if (showNotice) {
          this.$notify.success({
            message: '刷新成功'
          })
        }
        this.serverTableData = res.data
      }).catch(err => {
        this.$notify.error({
          message: '获取数据失败'
        })
        console.log('getServerList', err)
      })
    },
    // table相关
    resetForm() {
      this.$refs['ruleForm'].resetFields()
    },
    saveRepiar() { // 确定
      this.$refs['ruleForm'].validate((v) => {
        if (v) {
          delete this.serverObj.type
          this.loadingSave = true
          if (this.modelTitle === '添加服务器') {
            addServer(this.serverObj).then(() => {
              this.$notify.success({
                message: '添加成功'
              })
              this.loadingSave = false
              this.refreshTable(false)
              this.showServerModel = false
            }).catch(err => {
              this.loadingSave = false
              console.log('addServer', err)
            })
          } else {
            updateServer(this.serverObj._id, this.serverObj).then(() => {
              this.$notify.success({
                message: '修改成功'
              })
              this.getTableData()
              this.showServerModel = false
              this.loadingSave = false
            }).catch(err => {
              this.loadingSave = false
              console.log('updateServer', err)
            })
          }
        }
      })
    },
    selectTable(arr) { // 选中获得数据
      this.selectTableRow = arr
    },
    getTableData() {
      getServerList({
        page: this.page,
        limit: this.limit
      }).then(res => {
        this.bscCount = +res.headers['x-bsc-count']
        this.serverTableData = res.data
      })
    },
    // 分页相关
    handleSizeChange(size) {
      this.limit = size
      this.getTableData()
    },
    handleCurrentChange(page) {
      this.page = page
      this.getTableData()
    },
    resize() {
      this.tableHeight = this.$refs['main'].offsetHeight - 144
    }
  },
  created() {
    this.refreshTable(false)
    this.$nextTick(() => {
      this.resize()
    })
  }
}
</script>
<style scoped lang="less">
@import '../../../assets/theme/common';
.diagnose-server-wrap {
  width: 100%;
  height: 100%;
  padding: 20px 0;
  display: flex;
  flex-flow: column;
}

.header-wrap {
  padding: 12px 24px;
  line-height: 40px;
  background-color: @main-color;
  ul {
    li {
      display: inline-block;
    }
  }
}

.main-wrap {
  flex: 1;
}

.footer-page {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: @table-header-bg-color;
  padding-right: 20px;
}

.form-input {
  width: 90%;
  margin-left: 10px;
}
</style>
<style lang='less'>
  @import '../../../assets/theme/common';
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
      color: @operation_thead_color;
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

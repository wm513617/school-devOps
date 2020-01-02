<template>
  <div class="repiar-wrap" v-resize="resize" ref="main">
    <header class="header-wrap">
      <ul>
        <li><Button type="primary" icon="el-icon-plus" @click="addRepair">添加</Button></li>
        <li><Button type="primary" icon="el-icon-edit" @click="editRepiar">修改</Button></li>
        <li><Button type="primary" icon="el-icon-remove-outline" @click="removeRepiar">删除</Button></li>
        <li><Button type="primary" icon="el-icon-refresh" @click="refreshTable">刷新</Button></li>
      </ul>
    </header>
    <main class="main-wrap">
      <Table size="small" :data="repiarTableData" :height="tableHeight" @selection-change="selectTable" highlight-current-row>
        <table-column width="55" type="selection"></table-column>
        <table-column label="序号" type="index" min-width="100" align="center"></table-column>
        <table-column label="单位名称" prop="maintenanceVendor" min-width="300" show-overflow-tooltip></table-column>
        <table-column label="联系人" prop="people" min-width="200"></table-column>
        <table-column label="联系电话" prop="telephone" min-width="150" align="center"></table-column>
        <table-column label="邮件地址" prop="mail" min-width="200" align="center"></table-column>
      </Table>
    </main>
    <footer class="footer-page">
      <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="bscCount" background>
      </Pagination>
    </footer>
    <Dialog :title="repiarModelTitle" width="800px" :visible="showRepiarModel" :show-close="false" @close="resetForm">
      <Form :model="repiarObj" :rules="repiarRule" ref="ruleForm" label-width="96px" :inline="true">
        <FormItem label="单位名称" prop="maintenanceVendor" style="display: block;">
          <Input class="form-input" placeholder="请输入名称" v-model="repiarObj.maintenanceVendor" />
        </FormItem>
        <FormItem label="联系人1" prop="pName1">
          <Input class="form-input" placeholder="姓名" v-model="repiarObj.pName1" />
        </FormItem>
        <FormItem prop="pTelephone1">
          <Input class="form-input" placeholder="电话" v-model="repiarObj.pTelephone1" />
        </FormItem>
        <FormItem prop="pMail1">
          <Input class="form-input" placeholder="邮件地址" v-model="repiarObj.pMail1" />
        </FormItem>
        <FormItem label="联系人2" prop="pName2">
          <Input class="form-input" placeholder="姓名" v-model="repiarObj.pName2" />
        </FormItem>
        <FormItem prop="pTelephone2">
          <Input class="form-input" placeholder="电话" v-model="repiarObj.pTelephone2" />
        </FormItem>
        <FormItem prop="pMail2">
          <Input class="form-input" placeholder="邮件地址" v-model="repiarObj.pMail2" />
        </FormItem>
        <FormItem label="联系人3" prop="pName2">
          <Input class="form-input" placeholder="姓名" v-model="repiarObj.pName3" />
        </FormItem>
        <FormItem prop="pTelephone3">
          <Input class="form-input" placeholder="电话" v-model="repiarObj.pTelephone3" />
        </FormItem>
        <FormItem prop="pMail3">
          <Input class="form-input" placeholder="邮件地址" v-model="repiarObj.pMail3" />
        </FormItem>
        <FormItem label="联系人4" prop="pName2">
          <Input class="form-input" placeholder="姓名" v-model="repiarObj.pName4" />
        </FormItem>
        <FormItem prop="pTelephone4">
          <Input class="form-input" placeholder="电话" v-model="repiarObj.pTelephone4" />
        </FormItem>
        <FormItem prop="pMail4">
          <Input class="form-input" placeholder="邮件地址" v-model="repiarObj.pMail4" />
        </FormItem>
      </Form>
      <div slot="footer" class="dialog-footer">
        <Button @click="saveRepiar">确 定</Button>
        <Button @click="showRepiarModel = false">取 消</Button>
      </div>
    </Dialog>
  </div>
</template>

<script>
import { getCompanyList, addCompany, setCompany, delCompany } from '@/http/repairCompany.api'
import { validateName16, validateNames16, validateName32, validateTelephone, validateTelephone1, validateMail1 } from '../../business/assetsManage/validate.js'
export default {
  data() {
    return {
      repiarTableData: [],
      selectTableRow: [],
      tableHeight: '100%',
      showRepiarModel: false,
      repiarModelTitle: '添加维保单位',
      repiarObj: {
        // 别问我问什么不循环，你自己试试
        maintenanceVendor: '',
        pName1: '',
        pTelephone1: '',
        pMail1: '',
        pName2: '',
        pTelephone2: '',
        pMail2: '',
        pName3: '',
        pTelephone3: '',
        pMail3: '',
        pName4: '',
        pTelephone4: '',
        pMail4: ''
      },
      repiarRule: {
        maintenanceVendor: [{ required: true, validator: validateName32, trigger: 'change' }],
        pName1: [{ required: true, validator: validateName16, trigger: 'change' }],
        pTelephone1: [{ required: true, validator: validateTelephone, trigger: 'change' }],
        pMail1: [{ validator: validateMail1, trigger: 'change' }],
        pName2: [{ validator: validateNames16, trigger: 'change' }],
        pTelephone2: [{ validator: validateTelephone1, trigger: 'change' }],
        pMail2: [{ validator: validateMail1, trigger: 'change' }],
        pName3: [{ validator: validateNames16, trigger: 'change' }],
        pTelephone3: [{ validator: validateTelephone1, trigger: 'change' }],
        pMail3: [{ validator: validateMail1, trigger: 'change' }],
        pName4: [{ validator: validateNames16, trigger: 'change' }],
        pTelephone4: [{ validator: validateTelephone1, trigger: 'change' }],
        pMail4: [{ validator: validateMail1, trigger: 'change' }]
      },
      bscCount: 0, // 数据总计条数
      page: 1, // 当前页
      limit: 100 // 页大小
    }
  },
  methods: {
    // 按钮相关
    editRepiar() {
      if (this.selectTableRow.length > 1) {
        return this.$notify.warning({
          message: '一次只能修改一个!'
        })
      } else if (this.selectTableRow.length < 1) {
        return this.$notify.warning({
          message: '请选择修改项!'
        })
      }
      let temp = this.selectTableRow[0]
      this.repiarObj = {
        maintenanceVendor: temp.maintenanceVendor,
        pName1: temp.contacts[0].contact,
        pTelephone1: temp.contacts[0].phone,
        pMail1: temp.contacts[0].email,
        pName2: temp.contacts[1].contact,
        pTelephone2: temp.contacts[1].phone,
        pMail2: temp.contacts[1].email,
        pName3: temp.contacts[2].contact,
        pTelephone3: temp.contacts[2].phone,
        pMail3: temp.contacts[2].email,
        pName4: temp.contacts[3].contact,
        pTelephone4: temp.contacts[3].phone,
        pMail4: temp.contacts[3].email,
        _id: temp._id
      }
      this.repiarModelTitle = '修改维保单位'
      this.showRepiarModel = true
    },
    removeRepiar() {
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
        const result = this.selectTableRow.map(obj => { return obj._id })
        delCompany(result).then(() => {
          getCompanyList().then(res => {
            this.bscCount = +res.headers['x-bsc-count']
            this.foramtTableData(res.data)
          })
          this.$notify.success({
            message: '删除成功'
          })
        }).catch(err => {
          console.log('delCompany', err)
          this.$notify.error({
            message: '修改失败'
          })
        })
      })
    },
    foramtTableData(arr) {
      let result = arr.map(obj => {
        if (obj.contacts.length > 0) {
          obj.people = obj.contacts[0].contact
          obj.telephone = obj.contacts[0].phone
          obj.mail = obj.contacts[0].email
        }
        return obj
      })
      this.repiarTableData = result
    },
    refreshTable(showNotice) {
      getCompanyList().then(res => {
        this.bscCount = +res.headers['x-bsc-count']
        this.foramtTableData(res.data)
        if (showNotice) {
          this.$notify.success({
            message: '刷新成功'
          })
        }
      }).catch((err) => {
        this.$notify.error({
          message: '刷新失败'
        })
        console.log('getCompanyList', err)
      })
    },
    // table相关
    resetForm() {
      this.$refs['ruleForm'].resetFields()
    },
    saveRepiar() {
      this.$refs['ruleForm'].validate((v) => {
        if (v) {
          const result = {
            maintenanceVendor: this.repiarObj.maintenanceVendor,
            contacts: [
              {
                contact: this.repiarObj.pName1,
                email: this.repiarObj.pMail1,
                phone: this.repiarObj.pTelephone1
              },
              {
                contact: this.repiarObj.pName2,
                email: this.repiarObj.pMail2,
                phone: this.repiarObj.pTelephone2
              },
              {
                contact: this.repiarObj.pName3,
                email: this.repiarObj.pMail3,
                phone: this.repiarObj.pTelephone3
              },
              {
                contact: this.repiarObj.pName4,
                email: this.repiarObj.pMail4,
                phone: this.repiarObj.pTelephone4
              }
            ]
          }
          if (this.repiarModelTitle === '添加维保单位') {
            addCompany(result).then(() => {
              this.showRepiarModel = false
              this.$notify.success({
                message: '添加成功'
              })
              this.refreshTable(false)
            }).catch(err => {
              console.log('addCompany', err)
              this.$notify.error({
                message: '修改失败'
              })
            })
          } else {
            setCompany(this.repiarObj._id, result).then(() => {
              this.showRepiarModel = false
              this.refreshTable(false)
              this.$notify.success({
                message: '修改成功'
              })
            }).catch(err => {
              console.log('addCompany', err)
              this.$notify.error({
                message: '修改失败'
              })
            })
          }
        }
      })
    },
    addRepair() { // 添加
      this.repiarObj = {
        maintenanceVendor: '',
        pName1: '',
        pTelephone1: '',
        pMail1: '',
        pName2: '',
        pTelephone2: '',
        pMail2: '',
        pName3: '',
        pTelephone3: '',
        pMail3: '',
        pName4: '',
        pTelephone4: '',
        pMail4: ''
      }
      this.repiarModelTitle = '添加维保单位'
      this.showRepiarModel = true
    },
    // 分页相关
    selectTable(arr) {
      this.selectTableRow = arr
    },
    getTableData() {
      getCompanyList({
        page: this.page,
        limit: this.limit
      }).then(res => {
        this.bscCount = +res.headers['x-bsc-count']
        this.foramtTableData(res.data)
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
.repiar-wrap {
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
  width: 200px;
  margin-left: 10px;
}
</style>
<style lang="less">
  @import '../../../assets/theme/common';

  .el-dialog {
    border-radius: 8px 8px 0 0;
    background-color: @table-body-gb-color;
    .el-button {
      color: @operation_btn_color;
    }
  }
  .dialog-footer .el-button {
    color: @operation_btn_color;
    background: @btn_background_primary;

    &:hover {
      background: @ghost-hover-btn-gb-color;
    }
  }
</style>

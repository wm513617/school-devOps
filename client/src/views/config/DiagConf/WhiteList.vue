<template>
  <div class="whiteList content content-style" v-resize="resize">
    <div class="content">
      <div class="operating-space">
        <Button icon="el-icon-plus" @click="addWhite">添加</Button>
        <Button icon="el-icon-remove-outline" @click="deleteWhite">移除</Button>
        <Button icon="el-icon-refresh" @click="getDataList(1)">刷新</Button>
        <div class="search">
          <Input placeholder="请输入通道名称或设备IP" v-model="seek" style="width: 240px;margin-left:12px" size="mini" @keyup.enter.native="getDataList">
          <Button type="primary" @click="getDataList" slot="append" style="color:#fff">搜索</Button>
          </Input>
        </div>
      </div>
      <div class="table" ref="table">
        <Table ref="tableItem" :height="tableHeight" :data="tableDataList" style="width: 100%" v-loading="loading" @selection-change="selectChange" highlight-current-row>
          <TableColumn type="selection" width="55"></TableColumn>
          <TableColumn type="index" label="序号" align="center"></TableColumn>
          <TableColumn label="通道名称" width="280" align="center">
            <template slot-scope="scope">{{scope.row.name ? scope.row.name : '-'}}</template>
          </TableColumn>
          <TableColumn label="所属设备" align="center">
            <template slot-scope="scope">{{scope.row.device ? scope.row.device[0].name : '-'}}</template>
          </TableColumn>
          <TableColumn label="IP地址" align="center">
            <template slot-scope="scope">{{scope.row.device ? scope.row.device[0].ip : '-'}}</template>
          </TableColumn>
          <TableColumn label="通道号" align="center">
            <template slot-scope="scope">{{scope.row.chan ? scope.row.chan : '-'}}</template>
          </TableColumn>
          <TableColumn label="厂商" align="center">
            <template slot-scope="scope">{{scope.row.device ? scope.row.device[0].manufacturer : '-'}}</template>
          </TableColumn>
          <TableColumn label="所属机构" align="center">
            <template slot-scope="scope">{{scope.row.orgs ? scope.row.orgs[0].name : '-'}}</template>
          </TableColumn>
        </Table>
      </div>
      <div class="paging">
        <div class="paging-content">
          <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="total" background>
          </Pagination>
        </div>
      </div>
    </div>
    <WhiteDialog ref="whiteDialog" :treeData="treeData" :dialogTime='dialogTime' :showDialog='showDialog' @cancel='cancel' @submitDialog="submitDialog"></WhiteDialog>
  </div>
</template>
<script>
import { getWhiteListData, addWhiteListData, delWhiteListData, getWhiteListTree } from '@/http/diagConf/whitelist.js'
import WhiteDialog from './WhiteList/WhiteDialog'
export default {
  components: {
    WhiteDialog
  },
  data() {
    return {
      terraceIp: '', // 校园平台ip 诊断流地址使用
      treeData: [],
      checkedWhite: [],
      tableHeight: '500px',
      seek: '',
      tableDataList: [],
      total: 0,
      checked: true,
      page: 1, // 第几页
      limit: 100, // 页大小
      loading: false,
      showDialog: false, // 是否展示弹窗
      dialogTime: '' // 白名单添加时间
    }
  },
  watch: {
    seek() {
      if (this.seek === '') {
        this.getDataList()
      }
    }
  },
  mounted() {
    this.$nextTick(function() {
      this.tableHeight = this.$refs['table'].offsetHeight + 'px'
    })
  },
  created() {
    this.getDataList()
  },
  methods: {
    deleteWhite() {
      if (this.checkedWhite.length < 1) {
        this.$notify.warning({ message: '请至少选择一条数据!' })
        return
      }
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let data = []
        this.checkedWhite.forEach(element => {
          data.push(element.whitelist)
        })
        delWhiteListData({ data }).then(res => {
          this.getDataList()
          this.$notify.success({ message: '删除成功!' })
        }).catch(() => {
          this.$notify.error({ message: '删除失败!' })
        })
      }).catch(() => {
      })
    },
    resize() {
      this.tableHeight = this.$refs['table'].offsetHeight + 'px'
    },
    handleSizeChange(val) {
      this.limit = val
      this.getDataList()
    },
    handleCurrentChange(val) {
      this.page = val
      this.getDataList()
    },
    // 选择
    selectChange(selection) {
      this.checkedWhite = selection
    },
    // 获取白名单数据
    getDataList(val) {
      this.loading = true
      const params = {
        page: this.page,
        limit: this.limit,
        seek: this.seek
      }
      getWhiteListData(params).then(suc => {
        console.log(suc, 'getsuc')
        if (!(suc.data instanceof Array)) {
          this.$notify.error({
            message: '获取数据失败'
          })
          this.loading = false
          return
        }
        // console.log(222, this.$refs.tableItem.clearSort)
        this.total = Number(suc.headers['x-bsc-count'])
        // this.$refs.tableItem.clearSort()
        this.tableDataList = suc.data
        // this.$set(this, 'tableDataList', suc.data)
        this.loading = false
        if (val === 1) {
          this.$notify.success({ message: '刷新白名单成功!' })
        }
      }).catch(err => {
        console.log(err)
        this.$notify.error({
          message: '获取数据失败'
        })
        this.loading = false
      })
    },
    // 添加按钮
    addWhite() {
      getWhiteListTree().then(suc => {
        console.log(suc)
        this.treeData = [suc.data]
        this.dialogTime = this.$moment().format('YYYY-MM-DD HH:mm:ss')
        this.showDialog = true
      }).catch(err => {
        console.log(err)
        this.$notify.warning({
          message: '设备获取失败！'
        })
      })
    },
    // 弹窗关闭
    cancel(val) {
      this.showDialog = val
    },
    // 弹窗确定
    submitDialog(val) {
      addWhiteListData({ data: val }).then(suc => {
        this.showDialog = false
        this.$refs.whiteDialog.emptyData()
        this.getDataList()
      }).catch(err => {
        console.log(err)
        this.$notify.error({
          message: '添加数据错误'
        })
      })
    }
  }
}
</script>
<style lang="less" scoped>
@import '../../../assets/theme/common';
.whiteList {
  font-size: 12px;
  .content {
    min-height: 670px;
    background: #1b3153;
    width: 100%;
    height: 100%;
    display: block;
    .operating-space {
      width: 100%;
      height: 56px;
      background-color: @main-color;
      padding: 12px 36px 12px 24px;
      overflow: hidden;
      .checkbox {
        margin-left: 12px;
      }
      .search {
        float: right;
        .el-input {
          margin-left: 8px;
        }
      }
    }
    .table {
      width: 100%;
      height: calc(100% - 96px);
    }
    .paging {
      height: 40px;
      background: @table-header-bg-color;
      padding-right: 20px;
      overflow: hidden;
      .paging-content {
        float: right;
        padding: 3px 10px;
      }
    }
  }
}
</style>

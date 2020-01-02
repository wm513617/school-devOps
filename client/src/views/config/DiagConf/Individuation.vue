<template>
    <div class="indivduate content content-style" v-resize="resize">
      <div class="content-left">
        <div style="text-align:center">
          <p class="change">选择机构</p>
          <Input placeholder="请输入内容" suffix-icon="el-icon-search" size="small" v-model="treeKey" style="width:90%;margin:10px auto"/>
        </div>
        <TreeSearch :treeData="treeData" :searchVal="treeKey" ref="orgTree" @node-click="clickNodes">
          <template slot-scope="{ node }">
              {{node.name}}
          </template>
        </TreeSearch>
      </div>
      <div class="content-main ">
        <div class="indivduate-actions">
          <div>
            <Button type="primary" icon="el-icon-refresh" size="mini" @click="getableData">刷新</Button>
            <Checkbox v-model="sub">包含子机构</Checkbox>
          </div>
         <div>
            <!-- <Select v-model="onLineState" placeholder="请选择" size="mini" style="width:150px">
              <Option v-for="item in onLineStateOpt" :key="item.value" :label="item.label" :value="item.value">
              </Option>
            </Select> -->
            <Input placeholder="请输入通道名称或设备IP" v-model="seek" style="width: 240px;margin-left:12px" size="mini">
              <Button type="primary" @click="searchTable" slot="append" style="color:#fff">搜索</Button>
            </Input>
         </div>
        </div>
        <div class="indivduate-table" ref="tableWrap">
          <Table :data="tableData"
            :height="tableHeight"
            style="width: 100%"
            v-loading='loading'
            highlight-current-row>
            <TableColumn type="selection" width="55"></TableColumn>
            <TableColumn type="index" label="序号" align="center" width="55"></TableColumn>
            <TableColumn label="通道名称" width="300">
              <template slot-scope="scope">{{ scope.row.name }}</template>
            </TableColumn>
            <TableColumn label="所属设备">
              <template slot-scope="scope">{{ scope.row.eid ? scope.row.eid.name : '-' }}</template>
            </TableColumn>
            <TableColumn label="设备IP" align="center">
              <template slot-scope="scope">{{ scope.row.eid.ip ? scope.row.eid.ip : '-' }}</template>
            </TableColumn>
            <TableColumn label="通道号" align="center">
              <template slot-scope="scope">{{ scope.row.chan ? scope.row.chan: '-' }}</template>
            </TableColumn>
            <TableColumn label="厂商" align="center">
              <template slot-scope="scope">{{ scope.row.eid.manufacturer }}</template>
            </TableColumn>
            <TableColumn label="所属机构" align="center">
              <template slot-scope="scope">{{ scope.row.org.name ? scope.row.org.name : '-' }}</template>
            </TableColumn>
            <TableColumn label="设置" align="center">
              <template slot-scope="scope">
                <i class="el-icon-edit-outline" @click="openSetModal(scope.row)"></i>
              </template>
            </TableColumn>
          </Table>
        </div>
        <div class="indivduate-page">
          <Pagination background
            :page-sizes="[25, 50, 100, 200]"
            :page-size="limit"
            :current-page="page"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="changeSize"
            @current-change="changeCurrent"
          ></Pagination>
        </div>
        <SetModal ref="setModal" :camera="selectCamera"></SetModal>
      </div>
    </div>
</template>
<script>
import TreeSearch from '@/components/BStree/TreeSearch.vue'
import SetModal from './Individuation/SetModal'
import { getOrgTree } from '@/http/org'
import { getDiagResTable } from '@/http/diagConf/individuation.js'
export default {
  components: {
    TreeSearch,
    SetModal
  },
  data() {
    return {
      treeData: {},
      treeKey: '',
      tableData: [
      ],
      loading: false,
      sub: true,
      oid: '',
      seek: '',
      page: 1,
      limit: 25,
      total: 0,
      tableHeight: 200,
      selectCamera: {},
      onLineStateOpt: [
        {
          value: 0,
          label: '全部'
        }, {
          value: 1,
          label: '未启用个性化'
        }, {
          value: -1,
          label: '启用个性化'
        }
      ],
      onLineState: 0
    }
  },
  created() {
    getOrgTree(0).then(suc => {
      this.treeData = JSON.parse(JSON.stringify(suc))
      this.oid = suc._id
      this.getableData()
    }).catch(err => {
      console.log(err)
    })
  },
  mounted() {
    this.$nextTick(function() {
      this.tableHeight = this.$refs['tableWrap'].offsetHeight
    })
  },
  watch: {
    'sub'() {
      this.getableData()
    }
  },
  methods: {
    getableData() {
      this.loading = true
      getDiagResTable({
        oid: this.oid,
        sub: this.sub ? 1 : 0,
        seek: this.seek,
        page: this.page,
        limit: this.limit
      }).then(suc => {
        this.tableData = suc.data
        this.total = Number(suc.headers['x-bsc-count'])
        this.loading = false
      })
    },
    clickNodes(node) {
      this.oid = node._id
      this.getableData()
    },
    changeCurrent(n) {
      this.page = n
      this.getableData()
    },
    changeSize(n) {
      this.limit = n
      this.getableData()
    },
    searchTable() {
      this.getableData()
    },
    openSetModal(scope) {
      if (!scope.eid.ip || !scope.eid.cport) {
        return this.$notify.error({
          message: '通道数据不正确'
        })
      }
      this.selectCamera = scope
      this.$refs.setModal.modal = true
    },
    resize() {
      this.tableHeight = this.$refs['tableWrap'].offsetHeight
    }
  }
}
</script>
<style lang="less" scoped>
@import '../../../assets/theme/common';
  .indivduate {
    overflow: hidden;
  }
  .indivduate-actions {
    display: flex;
    justify-content: space-between;
    padding: 12px 24px;
  }
  .indivduate-table {
    height: calc(100% - 96px);
    .el-icon-edit-outline {
      cursor: pointer;
    }
  }
  .indivduate-page {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 40px;
    background: @operation_background_footer;
    padding-right: 20px;
    .el-pagination {
      padding: 0;
      float: right;
    }
  }
  .change {
    color: @operation_thead_color;
    line-height:40px;
    background:@title-top-background;
    margin:0px;
  }
</style>

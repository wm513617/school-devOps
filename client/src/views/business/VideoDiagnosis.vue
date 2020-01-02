<template>
  <div class="video-diagnosis content content-style" v-resize="resize">
    <div class="content-left">
      <div style="text-align:center">
        <p class='title-top'>选择机构</p>
        <Input placeholder="请输入内容" suffix-icon="el-icon-search" size="small" v-model="searchVal" style="width:90%;margin:10px auto" />
      </div>
      <TreeSearch style="height: calc(100% - 92px); overflow: auto;" :treeData="treeData" :searchVal="searchVal" ref="orgTree" @node-click="clickNodes">
        <template slot-scope="{ node }">
          {{node.name}}
        </template>
      </TreeSearch>
    </div>
    <div class="content-main" ref='bsMain'>
      <div class="main-section">
        <div class="section-tabs">
          <!-- <Button type="primary" icon="el-icon-zoom-in" size="mini">手动检测</Button> -->
          <Button type="primary" icon="el-icon-refresh" size="mini" @click="refresh">刷新</Button>
          <Button type="primary" icon="el-icon-download" size="mini" @click="exportCSV">导出</Button>
          <Button type="primary" icon="el-icon-plus" size="mini" @click="addOpenModal">创建工单</Button>
          <Checkbox v-model="never" class="check-box">显示子机构设备</Checkbox>
          <div class="statis-info">
            <span>统计：</span>
            <span style="color:#62c370">{{allStatus.online}}</span>
            <span>|</span>
            <span style="color:#c42847">{{allStatus.offline}}</span>
          </div>
          <div class="content-null"></div>
          <span>在线状态：</span>
          <Select v-model="onLineState" placeholder="请选择" size="mini" style="width:100px" @change="getTableData">
            <Option v-for="item in onLineStateOpt" :key="item.value" :label="item.label" :value="item.value">
            </Option>
          </Select>
          <span>诊断异常项：</span>
          <Select v-model="abnormalVal" placeholder="请选择" size="mini" style="width:100px" @change="getTableData">
            <Option v-for="item in abnormalItem" :key="item.value" :label="item.title" :value="item.name">
            </Option>
          </Select>
          <Input v-model="seek" placeholder="请输入设备名称或设备IP" style="width: 240px;margin-left:12px" size="mini" @keyup.enter.native="search">
          <Button type="primary" slot="append" @click="search" style="color:#fff">搜索</Button>
          </Input>
        </div>
        <div class="section-table">
          <Table :data="tableData" style="width: 100%" :height="tableHeight" v-loading="loading" @selection-change="selectServeRow" highlight-current-row>
            <TableColumn type="selection" min-width="50" align="center"></TableColumn>
            <TableColumn label="序号" type="index" min-width="80" align="center"></TableColumn>
            <TableColumn label="通道名称" prop="name" min-width="200" show-overflow-tooltip></TableColumn>
            <TableColumn label="在线状态" min-width="80" align="center">
              <template slot-scope="scope">
                <!-- <span v-if="!scope.row.status">-</span> -->
                <div :class="scope.row.status?'normal-color':'abnormal-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="IP地址" prop="ip" min-width="150" align="center"></TableColumn>
            <!-- <TableColumn label="移动侦测" min-width="50" align="center">
              <template slot-scope="scope">
                <div :class="scope.row.detail ? scope.row.detail[0].normal ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn> -->
            <TableColumn label="信号缺失" min-width="70" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.sm ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="清晰度异常" min-width="80" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.ac ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="画面遮挡" min-width="70" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.vc ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="场景切换" min-width="70" align="center">
              <template slot-scope="scope">
                <div :class="scope.row.result ? scope.row.result.sc ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="亮度异常" min-width="70" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.ab ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="画面冻结" min-width="70" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.pf ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="噪声检测" min-width="70" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.nd ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <TableColumn label="偏色检测" min-width="70" align="center">
              <template slot-scope="scope">
                <!-- <div v-if="scope.row.status==='offline'" class="failure-color"></div> -->
                <div :class="scope.row.result ? scope.row.result.pc ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn>
            <!-- <TableColumn label="PTZ失控" min-width="50" align="center">
              <template slot-scope="scope">
                <div :class="scope.row.result ? scope.row.result.ptz ? 'normal-color' : 'abnormal-color' : 'failure-color'"></div>
              </template>
            </TableColumn> -->
            <TableColumn label="最后检测时间" min-width="150" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.time ? $moment.utc(scope.row.time).format('YYYY-MM-DD HH:mm:ss') : '-'}}</span>
              </template>
            </TableColumn>
            <TableColumn min-width="100" label="诊断详情" align="center">
              <template slot-scope="scope">
                <i class="el-icon-document" style="cursor: pointer" @click="tableOpenModal(scope)"></i>
              </template>
            </TableColumn>
          </Table>
        </div>
        <div class="section-footer">
          <div class="footer-left">
            <div class="normal-color"></div><span>正常</span>
            <div class="abnormal-color"></div><span>异常</span>
            <div class="failure-color"></div><span>连接失败</span>
          </div>
          <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="bscCount" background>
          </Pagination>
        </div>
      </div>
    </div>
    <DiagnosisDialog :showDialog='showDialog' @cancel='cancel' :titleHeader='titleHeader' :endTime='endTime' :diagnoseParam='diagnoseParam' :imgPic='imgPic' :videoParam='videoParam'></DiagnosisDialog>
    <OrderDialog v-if="dialogVisible" :orderTitle="orderTitle" :defaultTreeChecked="changeCheckedArry" :defaultTreeBigType="defaultTreeBigType" :dialogVisible="dialogVisible" @cancel='cancelOrder' ref="orderDialog"></OrderDialog>
  </div>
</template>

<script>
import OrderDialog from './workOrder/OrderDialog'
import DiagnosisDialog from './VideoDiagnosis/DiagnosisDialog'
import TreeSearch from '@/components/BStree/TreeSearch.vue'
import { getOrgTree } from '@/http/org'
import { getVideoDiagData, getDiagFinalStatus } from '@/http/videoDiagnosis.api'
// import { exceptionItems } from '@/constant.js'
export default {
  components: {
    DiagnosisDialog,
    TreeSearch,
    OrderDialog
  },
  data() {
    return {
      allStatus: {
        offline: 0,
        online: 0
      },
      searchVal: '', // 机构树搜索
      treeData: {}, // 机构树数据
      limit: 100,
      page: 1,
      never: true,
      onLineState: 0,
      // 选择在线状态
      onLineStateOpt: [
        {
          value: 0,
          label: '全部'
        }, {
          value: 1,
          label: '在线'
        }, {
          value: -1,
          label: '离线'
        }
      ],
      abnormalVal: '2',
      // 诊断异常项
      abnormalItem: [
        { name: '2', title: '全部' },
        { name: '0', title: '异常' },
        { name: '1', title: '正常' }
        // { name: '0', title: '移动侦测' },
        // { name: '1', title: '场景切换' },
        // { name: '2', title: '清晰度异常' },
        // { name: '3', title: '视频遮挡' },
        // { name: '4', title: '亮度异常' },
        // { name: '5', title: '信号缺失' },
        // { name: '6', title: '画面冻结' },
        // { name: '7', title: '噪声检测' },
        // { name: '8', title: '偏色检测' },
        // { name: '9', title: '云台失控' }
      ],
      seek: '',
      bscCount: 0,
      sub: 1, // 1为显示子机构,0为不显示子机构
      tableHeight: 420,
      tableData: [], // 诊断数据
      oid: '', // 机构ID
      loading: false,
      showDialog: false,
      titleHeader: '',
      endTime: '',
      diagnoseParam: {},
      imgPic: '',
      videoParam: {},
      dialogVisible: false,
      orderTitle: '创建工单',
      changeCheckedArry: [],
      defaultTreeBigType: 0
    }
  },
  methods: {
    addOpenModal() { // 创建工单
      if (this.changeCheckedArry.length > 0) {
        this.orderTitle = '创建工单'
        this.dialogVisible = true
      } else {
        this.$notify.warning({ message: '请选择一个设备' })
      }
    },
    cancelOrder(val) { // 关闭工单弹窗
      this.dialogVisible = val
    },
    selectServeRow(val) {
      this.changeCheckedArry = val
    },
    // 获取机构树id
    clickNodes(val) {
      this.oid = val._id
      this.page = 1
      this.getTableData()
      this.diagFinalStatus()
    },
    // 每页条数变化
    handleSizeChange(val) {
      this.limit = val
      this.getTableData()
    },
    // 当前页变化
    handleCurrentChange(val) {
      this.page = val
      this.getTableData()
    },
    refresh() {
      this.getTableData()
    },
    search() {
      this.page = 1
      this.getTableData()
    },
    // 获取数据
    getTableData() {
      this.loading = true
      const params = {
        oid: this.oid,
        limit: this.limit,
        seek: this.seek,
        page: this.page,
        sub: this.sub,
        status: this.onLineState,
        snece: this.abnormalVal
      }
      getVideoDiagData(params).then(suc => {
        console.log(suc)
        if (suc.data) {
          this.tableData = suc.data
          this.bscCount = Number(suc.headers['x-bsc-count'])
          // this.tableData.forEach(item => {
          //   item.time = this.$moment(new Date(new Date(item.time).getTime() - 8 * 60 * 60 * 1000)).format('YYYY-MM-DD HH:mm:ss')
          // })
        }
        this.loading = false
      }).catch(err => {
        this.$notify.error({
          message: err.message
        })
        this.loading = false
      })
    },
    // 打开详情模块
    tableOpenModal(scope) {
      console.log(scope)
      this.endTime = scope.row.time ? this.$moment.utc(scope.row.time).format('YYYY-MM-DD HH:mm:ss') : ''
      this.diagnoseParam = scope.row.result || {}
      this.imgPic = scope.row.pic
      this.titleHeader = scope.row.name
      this.showDialog = true
      this.videoParam = {
        ip: scope.row.ip,
        port: scope.row.port,
        channel: scope.row.channel,
        streamType: 'main'
      }
    },
    cancel(val) {
      // 关闭详情模块
      this.showDialog = val
    },
    resize() {
      const DOMBsMain = this.$refs['bsMain']
      this.tableHeight = DOMBsMain.offsetHeight - 96
    },
    exportCSV() {
      if (!this.elemIF) {
        this.elemIF = document.createElement('iframe')
      }
      this.elemIF.src = `${window.origin}/ops/diag/final/listExport?oid=${this.oid}`
      this.elemIF.style.display = 'none'
      document.body.appendChild(this.elemIF)
    },
    diagFinalStatus() {
      // 获取所有诊断镜头在线离线数
      let data = {
        params: {
          sub: this.sub,
          oid: this.oid
        }
      }
      getDiagFinalStatus(data).then(res => {
        this.allStatus = res.data
      }).catch(err => {
        console.log(err)
      })
    }
  },
  mounted() {
    const DOMBsMain = this.$refs['bsMain']
    this.$nextTick(function() {
      this.tableHeight = DOMBsMain.offsetHeight - 96
    })
  },
  created() {
    getOrgTree(0).then(suc => {
      this.treeData = JSON.parse(JSON.stringify(suc))
      this.oid = suc._id
      this.getTableData()
      this.diagFinalStatus()
    }).catch(err => {
      console.log(err)
    })
  },
  watch: {
    never() {
      this.sub = this.never ? 1 : 0
      this.getTableData()
      this.diagFinalStatus()
    }
  }
}
</script>

<style scope lang='less'>
@import '../../assets/theme/common';
.content-main {
  overflow: hidden;
}
.main-section {
  background: #1c3053;
  display: flex;
  flex-direction: column;
}
.content-left .title-top {
  color: @operation_thead_color;
  line-height:40px;
  background:@title-top-background;
  margin:0px
}
/* .section-tabs {
  height: 32px;
  margin: 12px 24px;
  display: flex;
  align-items: center;
} */
/* .section-tabs span {
  font-size: 12px;
} */
.content-null {
  flex: 1;
}
.section-table {
  height: calc(100% - 96px);
  width: 100%;
}
.section-footer {
  height: 40px;
  padding: 0px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: @operation_background_footer;
}
.footer-left {
  display: flex;
  align-items: center;
}
.footer-left span {
  color: @operation_thead_color;
  margin-left: 5px;
  margin-right: 50px;
}
.check-box {
  margin-left: 12px;
}
.normal-color,
.abnormal-color,
.failure-color {
  height: 15px;
  width: 15px;
  border-radius: 50%;
  margin: auto auto;
}
.normal-color {
  background: #62c370;
}
.abnormal-color {
  background: #c42847;
}
.failure-color {
  background: #8a8a8a;
}
.content-main .statis-info span {
  font-size: 14px;
  margin-left: 12px;
}
.content-main .statis-info {
  margin-left: 8px;
}
</style>

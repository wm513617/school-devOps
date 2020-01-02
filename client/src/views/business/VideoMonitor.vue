<template>
  <div class="video-monitor content content-style" v-resize="resize">
    <div class="content-left">
      <videoTree ref="videoTree" @transmitClick="nodeId" :treeData="treeData" :storageTree="storageTree"></videoTree>
    </div>
    <div class="content-main">
      <div class="video-main-head">
        <div class="head-left">
          <!-- <Button type="primary" size="small" icon="el-icon-info">一致性检查</Button> -->
          <Button type="primary" size="small" icon="el-icon-refresh" @click="refresh">刷新</Button>
          <Button type="primary" size="small" icon="el-icon-upload" @click="exportCSV">导出</Button>
          <Button type="primary" size="small" icon="el-icon-plus" @click="addOpenModal">创建工单</Button>
          <Checkbox class="checkbox" v-model="checked">显示子机构设备</Checkbox>
          <Tooltip class="indicators" effect="dark" placement="bottom">
            <div slot="content">
              <p>指标详解</p>
              <p>【在线状态】-指视频通道的在线状态</p>
              <p>【正在录像】-指视频通道当前是否正在录像</p>
              <p>【已录时长】-视频通道当天已经录像的总时长</p>
              <p>【录像完整率】-通道当日的录像完整率</p>
            </div>
            <i class="el-icon-question"></i>
          </Tooltip>
          <div class="statis-info">
            <span>统计：</span>
            <span style="color:#62c370">{{recordingNum}}</span>
            <span>|</span>
            <span style="color:#c42847">{{noRecordingNum}}</span>
          </div>
        </div>
        <div class="head-right">
          <div class="state">
            <p style="margin: 0px;font-size: 12px">在线状态：</p>
            <Select v-model="value" placeholder="请选择" size="mini" style="width:100px" @change="search">
              <Option v-for="item in stateList" :key="item.value" :label="item.label" :value="item.value"></Option>
            </Select>
          </div>
          <div class="integrality">
            <p style="margin: 0px;font-size: 12px">录像状态：</p>
            <Select v-model="record" placeholder="请选择" size="mini" style="width:100px" @change="search">
              <Option v-for="item in recordList" :key="item.value" :label="item.label" :value="item.value"></Option>
            </Select>
          </div>
          <div class="integrality">
            <p style="margin: 0px;font-size: 12px">录像完整性：</p>
            <Select v-model="full" placeholder="请选择" size="mini" style="width:100px" @change="search">
              <Option v-for="item in integralityList" :key="item.value" :label="item.label" :value="item.value"></Option>
            </Select>
          </div>
          <div class="search">
            <Input size="small" style="width: 240px;" placeholder="请输入通道名称或设备IP" v-model="seek" @keyup.enter.native="search">
            <Button slot="append" type="primary" icon="el-icon-search" @click="search"></Button>
            </Input>
          </div>
        </div>
      </div>
      <div class="video-main-table" ref="tableWrap">
        <Table :height="tableHeight" :data="tableDataList" style="width: 100%" v-loading='loading' @selection-change="selectServeRow" highlight-current-row>
          <TableColumn type="selection" width="55"></TableColumn>
          <TableColumn type="index" label="序号"></TableColumn>
          <TableColumn label="通道名称" width="215" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.name }}</template>
          </TableColumn>
          <TableColumn label="设备IP" align="center">
            <template slot-scope="scope">{{ scope.row.ip }}</template>
          </TableColumn>
          <TableColumn label="通道号" align="center">
            <template slot-scope="scope">{{ scope.row.chan }}</template>
          </TableColumn>
          <TableColumn label="在线状态" align="center">
            <template slot-scope="scope">
              <div v-if="scope.row.status===1" class="online-color"></div>
              <div v-else-if="scope.row.status===0" class="offline-color"></div>
              <span v-else>-</span>
            </template>
          </TableColumn>
          <TableColumn label="所属设备" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.devName }}</template>
          </TableColumn>
          <TableColumn label="所属服务器">
            <template slot-scope="scope">{{ scope.row.ip }}</template>
          </TableColumn>
          <TableColumn label="正在录像" align="center">
            <template slot-scope="scope">{{ scope.row.recording ? scope.row.recording === 'stoprecord' ? '否' : '是' : '否' }}</template>
          </TableColumn>
          <TableColumn label="已录时长" align="center">
            <template slot-scope="scope">{{ scope.row.duration }}</template>
          </TableColumn>
          <TableColumn label="当日录像完整率">
            <template slot-scope="scope">
              <div class="progress">
                <Progress :percentage="Number(scope.row.integrity ? scope.row.integrity : 0)" :text-inside="true" :stroke-width="12"></Progress>
              </div>
            </template>
          </TableColumn>
          <TableColumn label="录像详情" align="center">
            <template slot-scope="scope">
              <i class="el-icon-document" style="cursor: pointer" @click="particulars(scope.row)"></i>
            </template>
          </TableColumn>
          <TableColumn label="分析对比" align="center">
            <template slot-scope="scope">
              <i class="el-icon-edit" style="cursor: pointer" @click="comparison(scope.row)"></i>
            </template>
          </TableColumn>
        </Table>
      </div>
      <OnlineDetails :modalShow='modalShow' :detailData='detailData' :detailsLoading="detailsLoading" @searchData='searchData' :counts='detailCounts' :pageNumArray='pageNumArray' :pageNumProp='pageNumProp' :deviceName='deviceName' :timeData='timeData' @cancel='cancel' @sendData="sendData" :offlineColor='offlineColor' :onlineColor='onlineColor' :basicColor='basicColor' modalName="录像详情" onlineName="录像正常" offlineName="录像异常" baseName="未知" :isDevice="isDevice"></OnlineDetails>
      <div class="video-main-page">
        <Pagination background :page-sizes="[25, 50, 100, 200]" :page-size="limit" :current-page="page" layout="total, sizes, prev, pager, next, jumper" :total="bscCount" @size-change="handleSizeChange" @current-change="handleCurrentChange"></Pagination>
      </div>
    </div>
    <OrderDialog v-if="dialogVisible" :orderTitle="orderTitle" :defaultTreeChecked="changeCheckedArry" :defaultTreeBigType="defaultTreeBigType" :dialogVisible="dialogVisible" @cancel='cancelOrder' ref="orderDialog"></OrderDialog>
  </div>
</template>

<script>
import OrderDialog from './workOrder/OrderDialog'
import videoTree from './VideoMonitor/videoTree'
import { getVideoOrg, getStorageList, getStorageTree, getRecordInfoNum, getVideoHistoryData, getRecordDevInfoNum } from '@/http/video'
import { getOrgTree } from '@/http/org'
import OnlineDetails from '@/components/timeBarDIV/onlineDetails'
import { getDevHistoryData } from '@/http/deviceMonitor.api'
export default {
  data() {
    return {
      isDevice: true,
      checked: true,
      limit: 100,
      page: 1,
      bscCount: 0,
      seek: '',
      sub: 1,
      full: 0,
      tableHeight: 420,
      modalShow: false,
      loading: true,
      treeData: {},
      storageTree: {},
      detailData: [],
      deviceName: '',
      timeData: [],
      onlineColor: '#62c370',
      basicColor: '#aaaaaa',
      offlineColor: '#c42847',
      startTime: '2019-01-01',
      endTime: '2019-01-07',
      selectedRow: null,
      tableDataList: [],
      value: 0,
      value1: 0,
      stateList: [{
        value: 0,
        label: '全部'
      }, {
        value: 1,
        label: '在线'
      }, {
        value: -1,
        label: '离线'
      }],
      record: 0,
      recordList: [{
        value: 0,
        label: '全部'
      }, {
        value: 1,
        label: '录像'
      }, {
        value: -1,
        label: '不录像'
      }],
      integralityList: [{
        value: 0,
        label: '全部'
      }, {
        value: 1,
        label: '完整'
      }, {
        value: -1,
        label: '不完整'
      }],
      elemIF: null,
      serialNum: '',
      recordingNum: 0, // 正在录像的的数量
      noRecordingNum: 0, // 没有正在录像的的数量
      dialogVisible: false,
      orderTitle: '创建工单',
      changeCheckedArry: [],
      defaultTreeBigType: 0,
      // DetailsLimit: '', // 详情弹窗页条数
      DetailsPage: '', // 详情弹窗当前页
      DetailsOnlineRate: '', // 详情弹窗状态选择
      sucTime: [], // 详情弹窗获取成功的时间
      sucData: [], // 详情弹窗获取成功的数据
      detailCounts: 0, // 详情弹窗数据条数
      pageNumArray: [7, 15], // 详情弹窗每页显示个数选择器的选项设置
      pageNumProp: 15, // 详情弹窗数据每页显示条目个数
      detailsLoading: false // 详情弹窗数据是否正在加载
    }
  },
  mounted() {
    this.$nextTick(function() {
      this.tableHeight = this.$refs['tableWrap'].offsetHeight
    })
  },
  destroyed() {
    this.elemIF = null
  },
  components: {
    videoTree,
    OnlineDetails,
    OrderDialog
  },
  methods: {
    /* lineState() {
      this.nodeData()
    }, */
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
    nodeId(val) {
      this.serialNum = val._id
      this.nodeData()
    },
    recordingInfoNum() { // 获取统计信息数量
      if (this.$refs.videoTree.activeName === 'org') {
        getRecordInfoNum(this.serialNum).then(res => {
          console.log(res, 'recordingInfoNum-res')
          this.recordingNum = res.data.on
          this.noRecordingNum = res.data.off
        }).catch(err => {
          console.log(err, 'recordingInfoNum-err')
        })
      } else {
        getRecordDevInfoNum(this.serialNum, this.sub).then(res => {
          console.log(res, 'getRecordDevInfoNum-res')
          this.recordingNum = res.data.on
          this.noRecordingNum = res.data.off
        }).catch(err => {
          console.log(err, 'getRecordDevInfoNum-err')
        })
      }
    },
    nodeData() {
      this.loading = true
      const videoData = {
        oid: this.serialNum,
        seek: this.seek,
        page: this.page,
        limit: this.limit,
        sub: this.sub,
        status: this.value,
        complete: this.full,
        record: this.record
      }
      console.log(this.$refs.videoTree.activeName === 'org')
      if (this.$refs.videoTree.activeName === 'org') {
        getVideoOrg(videoData).then(suc => {
          this.bscCount = Number(suc.headers['x-bsc-count'])
          this.tableDataList = suc.data
          this.tableDataList.forEach(item => {
            if (!item.duration) {
              item.duration = '0小时0分'
            } else {
              const time = parseInt(item.duration)
              const hour = parseInt(time / 60)
              const minute = parseInt(time % 60)
              item.duration = hour + '小时' + minute + '分'
            }
          })
          this.loading = false
        }).catch(err => {
          console.log(err)
        })
      } else {
        getStorageList(videoData).then(res => {
          this.bscCount = Number(res.headers['x-bsc-count'])
          this.tableDataList = res.data
          this.tableDataList.forEach(item => {
            if (!item.duration) {
              item.duration = '0小时0分'
            } else {
              const time = parseInt(item.duration)
              const hour = parseInt(time / 60)
              const minute = parseInt(time % 60)
              item.duration = hour + '小时' + minute + '分'
            }
          })
          this.loading = false
        }).catch(err => {
          console.log(err)
        })
      }
    },
    handleSizeChange(val) {
      this.page = 1
      this.limit = val
      this.nodeData()
    },
    handleCurrentChange(val) {
      this.page = val
      this.nodeData()
    },
    refresh() {
      this.page = 1
      this.nodeData()
    },
    search() {
      this.page = 1
      this.nodeData()
    },
    particulars(row) {
      this.isDevice = true
      this.selectedRow = row
      this.deviceName = row.name
      this.getDevHistoryInfoData()
      this.modalShow = true
    },
    comparison(row) {
      this.isDevice = false
      this.selectedRow = row
      this.deviceName = row.name
      this.getVideoInfoData()
      this.modalShow = true
    },
    cancel(val) {
      this.modalShow = val
      this.detailData = []
      this.timeData = []
      this.DetailsOnlineRate = ''
    },
    resize() {
      this.tableHeight = this.$refs['tableWrap'].offsetHeight
    },
    getDevHistoryInfoData() {
      this.endTime = this.$moment().format('YYYY-MM-DD')
      let sTime = this.$moment().subtract(14, 'days').calendar()
      this.startTime = this.$moment(new Date(sTime)).format('YYYY-MM-DD')
      let params = {
        channel: this.selectedRow.chan,
        ip: this.selectedRow.ip,
        startTime: this.startTime,
        endTime: this.endTime,
        port: this.selectedRow.port
      }
      // this.getRecordData(params)
      this.GetPageInfoData(params)
    },
    getRecordData(params) { // 获取录像详情数据
      this.detailsLoading = true
      getVideoHistoryData(params).then(suc => {
        console.log(suc, 'getVideoHistoryData-suc')
        let dateProp = []
        let dateDetailsProp = []
        suc.forEach((item, index) => {
          dateProp.push(item.t)
          dateDetailsProp[index] = []
          item.record.g.forEach((squre, sdex) => {
            let itemType
            if (item.record.s[sdex] === 'startrecord') {
              itemType = 1
            } else if (item.record.s[sdex] === 'stoprecord') {
              itemType = 2
            } else {
              itemType = null
            }
            if (item.record.g[sdex + 1]) {
              dateDetailsProp[index].push({
                // startTime: new Date(squre).getTime(),
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.record.g[sdex + 1]).getTime(),
                endTime: this.$moment(item.record.g[sdex + 1]).valueOf(),
                type: itemType
              })
            } else {
              dateDetailsProp[index].push({
                // startTime: new Date(squre).getTime(),
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.t).getTime() + 1000 * 3600 * 16 - 1,
                endTime: this.$moment(item.t).valueOf() + 1000 * 3600 * 24 - 1,
                type: itemType
              })
            }
          })
        })
        if (!this.DetailsOnlineRate) {
          this.timeData = dateProp
          this.detailData = dateDetailsProp
        } else {
          this.sucTime = dateProp
          this.sucData = dateDetailsProp
          this.filterData()
        }
        this.detailsLoading = false
      }).catch(err => {
        console.log(err)
        this.detailsLoading = false
        this.detailCounts = 0
        this.$notify.error({
          message: '获取录像详情数据错误'
        })
      })
    },
    getVideoInfoData() {
      this.endTime = this.$moment().format('YYYY-MM-DD')
      let sTime = this.$moment().subtract(14, 'days').calendar()
      this.startTime = this.$moment(new Date(sTime)).format('YYYY-MM-DD')
      let params = {
        category: 'online',
        channel: this.selectedRow.chan,
        ip: this.selectedRow.ip,
        startTime: this.startTime,
        endTime: this.endTime,
        port: this.selectedRow.port
      }
      // this.getAllData(params)
      this.GetPageInfoData(params)
    },
    async getAllData(params) { // 获取对比详情数据
      this.detailsLoading = true
      let dateProp = []
      let dateDetailsProp = []
      await Promise.all([getDevHistoryData(params), getVideoHistoryData(params)]).then(res => {
        res[0].forEach((item, index) => {
          dateProp.push(item.t)
          dateProp.push(null)
          dateDetailsProp[index * 2 + 1] = []
          item.online.g.forEach((squre, sdex) => {
            let itemType
            if (item.online.s[sdex] === 'online') {
              itemType = 1
            } else if (item.online.s[sdex] === 'offline') {
              itemType = 2
            } else {
              itemType = null
            }
            if (item.online.g[sdex + 1]) {
              dateDetailsProp[index * 2 + 1].push({
                // startTime: new Date(squre).getTime(),
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.online.g[sdex + 1]).getTime(),
                endTime: this.$moment(item.online.g[sdex + 1]).valueOf(),
                type: itemType
              })
            } else {
              dateDetailsProp[index * 2 + 1].push({
                // startTime: new Date(squre).getTime(),
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.t).getTime() + 1000 * 3600 * 16 - 1,
                endTime: this.$moment(item.t).valueOf() + 1000 * 3600 * 24 - 1,
                type: itemType
              })
            }
          })
        })
        res[1].forEach((item, index) => {
          dateDetailsProp[index * 2] = []
          item.record.g.forEach((squre, sdex) => {
            let itemType
            if (item.record.s[sdex] === 'startrecord') {
              itemType = 1
            } else if (item.record.s[sdex] === 'stoprecord') {
              itemType = 2
            } else {
              itemType = null
            }
            if (item.record.g[sdex + 1]) {
              dateDetailsProp[index * 2].push({
                // startTime: new Date(squre).getTime(),
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.record.g[sdex + 1]).getTime(),
                endTime: this.$moment(item.record.g[sdex + 1]).valueOf(),
                type: itemType
              })
            } else {
              dateDetailsProp[index * 2].push({
                // startTime: new Date(squre).getTime(),
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.t).getTime() + 1000 * 3600 * 16 - 1,
                endTime: this.$moment(item.t).valueOf() + 1000 * 3600 * 24 - 1,
                type: itemType
              })
            }
          })
        })
      }).catch(err => {
        console.log(err)
        this.detailCounts = 0
        this.$notify.error({
          message: '获取数据错误'
        })
      })
      if (!this.DetailsOnlineRate) {
        this.timeData = dateProp
        this.detailData = dateDetailsProp
      } else {
        this.sucTime = dateProp
        this.sucData = dateDetailsProp
        this.filterData(!this.isDevice)
      }
      this.detailsLoading = false
    },
    filterData(val) { // 详情弹窗数据分页过滤
      let propsTime = []
      let propsData = []
      let normalTime = []
      let normalData = []
      let abnormalTime = []
      let abnormalData = []
      if (val) {
        this.sucData.map((v, i) => {
          if (i % 2 === 0) {
            if (v.length === 1 && v[0].type === 1 && this.sucData[i + 1].length === 1 && this.sucData[i + 1][0].type === 1) {
              normalData.push(v)
              normalTime.push(this.sucTime[i])
              normalData.push(this.sucData[i + 1])
              normalTime.push(null)
            } else {
              abnormalData.push(v)
              abnormalTime.push(this.sucTime[i])
              abnormalData.push(this.sucData[i + 1])
              abnormalTime.push(null)
            }
          }
        })
      } else {
        this.sucData.map((v, i) => {
          if (v.length === 1 && v[0].type === 1) {
            normalData.push(v)
            normalTime.push(this.sucTime[i])
          } else {
            abnormalData.push(v)
            abnormalTime.push(this.sucTime[i])
          }
        })
      }
      if (this.DetailsOnlineRate === 1) {
        propsTime = normalTime
        propsData = normalData
      } else if (this.DetailsOnlineRate === 2) {
        propsTime = abnormalTime
        propsData = abnormalData
      } else {
        propsTime = this.sucTime
        propsData = this.sucData
      }
      if (propsData.length <= this.pageNumProp) {
        this.timeData = propsTime
        this.detailData = propsData
      } else {
        this.timeData = propsTime.slice((this.DetailsPage - 1) * this.pageNumProp, this.DetailsPage * this.pageNumProp)
        this.detailData = propsData.slice((this.DetailsPage - 1) * this.pageNumProp, this.DetailsPage * this.pageNumProp)
      }
      this.detailCounts = propsTime.length
    },
    searchData(val) {
      this.detailData = []
      this.timeData = []
      let params = {
        category: 'online',
        channel: this.selectedRow.chan,
        ip: this.selectedRow.ip,
        startTime: val[0],
        endTime: val[1],
        port: this.selectedRow.port
      }
      this.GetPageInfoData(params)
    },
    GetPageInfoData(params) { // 分页获取详情
      let sTime = this.$moment(params.startTime)
      let eTime = this.$moment(params.endTime)
      let dDay = eTime.diff(sTime, 'day') + 1
      this.detailCounts = dDay
      let times = Math.ceil(dDay / this.pageNumProp)
      let newStartTime, newEndTime
      if (this.DetailsOnlineRate) {
        newStartTime = params.startTime
        newEndTime = params.endTime
      } else {
        if (this.DetailsPage === times) {
          newStartTime = params.startTime
        } else {
          newStartTime = this.$moment(eTime).subtract(this.pageNumProp * this.DetailsPage - 1, 'days').format('YYYY-MM-DD')
        }
        if (this.DetailsPage === 1) {
          newEndTime = params.endTime
        } else {
          newEndTime = this.$moment(eTime).subtract(this.pageNumProp * (this.DetailsPage - 1), 'days').format('YYYY-MM-DD')
        }
      }
      let newParams = {
        category: 'online',
        channel: params.channel,
        ip: params.ip,
        startTime: newStartTime,
        endTime: newEndTime,
        port: params.port
      }
      if (this.isDevice) {
        this.pageNumArray = [7, 15]
        this.pageNumProp = 15
        this.getRecordData(newParams)
      } else {
        this.pageNumArray = [8, 16]
        this.pageNumProp = 16
        this.getAllData(newParams)
      }
    },
    sendData(data) {
      this.pageNumProp = data.limit
      this.DetailsPage = data.page
      this.DetailsOnlineRate = data.onlineRate
      // this.filterData(!this.isDevice)
      if (this.selectedRow) {
        this.searchData(data.selDateVal)
      }
    },
    getStorageTree() { // 获取按储存设备 的机构树
      getStorageTree().then(res => {
        this.storageTree = res.data
        console.log(res)
        this.serialNum = res.data._id
        this.nodeData()
      }).catch(err => {
        console.log(err)
        this.$notify.error({
          message: '获取存储机构树失败！'
        })
      })
    },
    getOrgTree() { // 按机构机构分
      getOrgTree(0).then(suc => {
        this.treeData = JSON.parse(JSON.stringify(suc))
        this.serialNum = suc._id
        this.nodeData()
      }).catch(err => {
        console.log(err)
      })
    },
    exportCSV() {
      if (!this.elemIF) {
        this.elemIF = document.createElement('iframe')
      }
      if (this.$refs.videoTree.activeName === 'org') {
        this.elemIF.src = `${window.origin}/ops/export/video/monitor/list?oid=${this.serialNum}&seek=${this.seek}&sub=${this.sub}&status=${this.value}&full=${this.full}&record=${this.record}`
      } else {
        this.elemIF.src = `${window.origin}/ops/export/storageList?oid=${this.serialNum}&seek=${this.seek}&page=${this.page}&limit=${this.limit}&sub=${this.sub}&status=${this.value}&full=${this.full}&record=${this.record}`
      }
      this.elemIF.style.display = 'none'
      document.body.appendChild(this.elemIF)
    }
  },
  created() {
    // this.getStorageTree()
    this.getOrgTree()
  },
  watch: {
    checked() {
      this.sub = this.checked ? 1 : 0
      this.nodeData()
      this.recordingInfoNum()
    },
    serialNum() {
      this.recordingInfoNum()
    }
  }
}
</script>
<style lang="less">
@import '../../assets/theme/common';
.video-monitor .el-progress-bar__inner {
  background: @tab-active-background;
}
.el-dialog {
  border-radius: 8px 8px 0 0;
  .el-dialog__body {
    background: @table-body-gb-color;
    .modol-header {
      .el-button {
        color: @table-header-text-color;
        background: @btn_background_primary;  //  主要按钮颜色
        &:hover {
          background: @ghost-hover-btn-gb-color;  //  按钮悬浮颜色
        }
      }
      .rt-selDate {
        .el-range-editor.is-active:hover {
          border-color: @ghost-hover-btn-gb-color;
        }
        .el-range-editor--small.el-input__inner, .el-range-editor--small.el-input__inner {
          background-color: @table-body-gb-color;
        }
      }
    }
    .modol-body-left-title {
      background: @tree-tabs-item-bg-color;
    }
    .title {
      background: @tree-tabs-item-bg-color;
    }
  }
  .el-dialog__footer {
    background: @table-body-gb-color;
    .el-button {
      background: @btn_background_primary;
      color: @table-header-text-color;
      &:hover {
        background: @ghost-hover-btn-gb-color;
      }
    }
    .el-pagination__total {
      color: @main-body-text-color;
    }
  }
}
.el-date-editor .el-range-input {
  background: @table-body-gb-color !important;
}
.popper__arrow {
  top: -7px;
  border-bottom-color: @input-border-color !important;
}
</style>
<style scoped lang='less'>
@import '../../assets/theme/common';
.video-monitor .el-progress-bar__outer {
  background-color: #ebeef5;
}
</style>
<style lang="less">
@import "../../assets/theme/common";

.content-left {
  height: 100%;
}
.content-main {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: @operation_content_main;
  .video-main-head {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 12px 24px;
    background: @operation_left_background;
    .head-left {
      display: flex;
      flex-direction: row;
      align-items: center;
      .checkbox {
        margin-left: 12px;
      }
      .indicators {
        margin-left: 12px;
      }
      .statis-info {
        margin-left: 32px;
      }
      .statis-info span {
        margin-left: 12px;
        font-size: 14px;
      }
    }
    .head-right {
      display: flex;
      flex-direction: row;
      .state {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-right: 20px;
      }
      .integrality {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-right: 20px;
      }
      .search {
        margin-right: 40px;
      }
    }
  }
  .video-main-table {
    flex-grow: 1;
    overflow: hidden;
  }
  .video-main-page {
    align-items: center;
    height: 40px;
    padding: 4px 20px;
    background: @operation_table_background;
    .el-pagination {
      padding: 0;
      float: right;
    }
  }
  .online-color,
  .offline-color {
    height: 15px;
    width: 15px;
    border-radius: 50%;
    margin: auto auto;
  }
  .online-color {
    background: #62c370;
  }
  .offline-color {
    background: #c42847;
  }
  .search {
    .el-button:hover {
      background: @primary-btn-bg-color;
      color: @main-body-text-color;
    }
  }
}
</style>

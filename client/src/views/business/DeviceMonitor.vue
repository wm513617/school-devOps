<template>
  <div class="device-monitor content content-style" v-resize="resize">
    <div class="content-left">
      <div style="text-align:center">
        <p class="select_jg">选择机构</p>
        <Input placeholder="请输入内容" suffix-icon="el-icon-search" size="small" class="select_org" v-model="searchVal" />
      </div>
      <TreeSearch style="height: calc(100% - 92px); overflow: auto;" :treeData="treeData" :searchVal="searchVal" ref="orgTree" @node-click="clickNodes">
        <template slot-scope="{ node }">
          {{node.name}}
        </template>
      </TreeSearch>
    </div>
    <div class="content-main" ref='bsMain'>
      <div class="main-section">
        <TableTab :isCount="true" :tabs="deviceTabs" @on-tab-click="changeTab"></TableTab>
        <div class="section-tabs">
          <Button type="primary" icon="el-icon-refresh" size="mini" @click="refresh">刷新</Button>
          <Button type="primary" icon="el-icon-download" size="mini" @click="exportCSV">导出</Button>
          <Button type="primary" icon="el-icon-plus" size="mini" @click="addOpenModal">创建工单</Button>
          <Checkbox v-model="never" class="check-box">显示子机构资源</Checkbox>
          <Tooltip class="help-style" placement="bottom">
            <i class="el-icon-question"></i>
            <div slot="content">
              <p>指标详解</p>
              <p>【在线状态】-指设备的在线/离线状态</p>
              <p>【在线率】-当日在线时长/当日至当前时间的时长，是一个相对比值，小数点保留两位</p>
              <p>【离线时长】- 当日，设备离线的总时长</p>
            </div>
          </Tooltip>
          <div class="statis-info">
            <span>统计：</span>
            <span style="color:#62c370">{{onLineNum}}</span>
            <span>|</span>
            <span style="color:#c42847">{{offLineNum}}</span>
            <!-- <span v-if="activeTab===0">|</span>
            <span style="color:yellow" v-if="activeTab===0">{{faultCount}}</span> -->
          </div>
          <div class="content-null"></div>
          <!-- <span>运行状态：</span>
          <Select v-model="runState" placeholder="请选择" size="mini" style="width:100px">
            <Option v-for="item in runStateOpt" :key="item.value" :label="item.label" :value="item.value">
            </Option>
          </Select> -->
          <span>在线状态：</span>
          <Select v-model="onLineState" placeholder="请选择" size="mini" style="width:100px" @change="search">
            <Option v-for="item in onLineStateOpt" :key="item.value" :label="item.label" :value="item.value">
            </Option>
          </Select>
          <span>在线率：</span>
          <Select v-model="onLineRate" placeholder="请选择" size="mini" style="width:100px" @change="search">
            <Option v-for="item in onLineRateOpt" :key="item.value" :label="item.label" :value="item.value">
            </Option>
          </Select>
          <Input v-model="seek" placeholder="请输入设备名称或设备IP" style="width: 240px;margin-left:12px" size="mini">
          <Button type="primary" slot="append" @click="search" style="color:#fff">搜索</Button>
          </Input>
        </div>
        <div class="section-table">
          <component :is='activeTabComponents[activeTab]' :tableHeight='tableHeight' :videoData='deviceData' :loading='loading' @openModal='openModal' @changeChecked="changeChecked"></component>
        </div>
        <div class="section-footer">
          <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="bscCount" background>
          </Pagination>
        </div>
      </div>
      <OnlineDetails :modalShow='modalShow' :detailData='detailData' :detailsLoading="detailsLoading" @sendData="sendData" :counts='detailCounts' :deviceName='deviceName' :timeData='timeData' @cancel='cancel' @searchData='searchData' :offlineColor='offlineColor' :onlineColor='onlineColor' :basicColor='basicColor'></OnlineDetails>
    </div>
    <OrderDialog v-if="dialogVisible" :orderTitle="orderTitle" :defaultTreeChecked="changeCheckedArry" :defaultTreeBigType="defaultTreeBigType" :dialogVisible="dialogVisible" @cancel='cancelOrder' ref="orderDialog"></OrderDialog>
  </div>
</template>

<script>
import TreeSearch from '@/components/BStree/TreeSearch.vue'
import TableTab from './DeviceMonitor/TableTab.vue'
import DecodingDevice from './DeviceMonitor/DecodingDevice'
import FireFightingApparatus from './DeviceMonitor/FireFightingApparatus'
import ServersDevice from './DeviceMonitor/ServersDevice'
import Servers from './DeviceMonitor/Servers'
import SplicDevice from './DeviceMonitor/SplicDevice'
import VideoEquipment from './DeviceMonitor/VideoEquipment'
import WarningFacility from './DeviceMonitor/WarningFacility'
import { getOrgTree } from '@/http/org'
import { getDeviceData, getDevHistoryData, getDeviceCount } from '@/http/deviceMonitor.api'
import OnlineDetails from '@/components/timeBarDIV/onlineDetails'
import OrderDialog from './workOrder/OrderDialog'
export default {
  components: {
    TreeSearch,
    TableTab,
    VideoEquipment,
    DecodingDevice,
    FireFightingApparatus,
    ServersDevice,
    Servers,
    SplicDevice,
    WarningFacility,
    OnlineDetails,
    OrderDialog
  },
  data() {
    return {
      searchVal: '',
      treeData: {},
      deviceTabs: [
        {
          title: '视频设备',
          value: 0,
          disabled: false,
          active: true,
          number: 0
        },
        {
          title: '报警主机',
          value: 1,
          disabled: false,
          active: false,
          number: 0
        },
        {
          title: '消防主机',
          value: 7,
          disabled: false,
          active: false,
          number: 0
        },
        {
          title: '解码器',
          value: 5,
          disabled: false,
          active: false,
          number: 0
        },
        {
          title: '拼接控制器',
          value: 9,
          disabled: false,
          active: false,
          number: 0
        }
        // {
        //   title: '服务器',
        //   value: 10,
        //   disabled: false,
        //   active: false,
        //   number: 0
        // },
        // {
        //   title: '服务',
        //   value: 11,
        //   disabled: false,
        //   active: false,
        //   number: 0
        // }
      ],
      never: true,
      // 选择运行状态
      runStateOpt: [
        {
          value: 0,
          label: '全部'
        }, {
          value: 1,
          label: '正常'
        }, {
          value: -1,
          label: '故障'
        }
      ],
      runState: 0,
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
      onLineState: 0,
      // 选择在线率
      onLineRateOpt: [
        {
          value: '',
          label: '全部'
        }, {
          value: 'normal',
          label: '正常'
        }, {
          value: 'abnormal',
          label: '异常'
        }
      ],
      onLineRate: '',
      // VideoEquipment          视频设备
      // WarningFacility         报警主机
      // FireFightingApparatus   消防主机
      // DecodingDevice          解码器
      // SplicDevice             拼接控制器
      // ServersDevice           服务器
      // Servers                 服务
      activeTabComponents: ['VideoEquipment', 'WarningFacility', 'FireFightingApparatus', 'DecodingDevice', 'SplicDevice', 'ServersDevice', 'Servers'],
      activeTab: 0, // 设备类型
      tableHeight: 420,
      deviceData: [], // 设备详细数据
      orgId: '', // 机构树节点ID
      seek: '', // 搜索内容
      bscCount: 0, // 数据总计条数
      page: 1, // 当前页
      limit: 100, // 页大小
      sub: 1, // 1为显示子机构,0为不显示子机构
      // onLineData: [], // 在线数据
      // offLineData: [], // 离线数据
      onLineNum: 0, // 在线数
      offLineNum: 0, // 离线数
      faultCount: 0, // 故障数量
      modalShow: false, // 详情展示
      selectedRow: null,
      onlineColor: '#62c370',
      basicColor: '#aaaaaa',
      offlineColor: '#c42847',
      detailData: [], // 详情数据
      startTime: '2019-01-01',
      endTime: '2019-01-07',
      timeData: [], // 详情界面时间数据
      deviceName: '', // 详情界面设备名称
      loading: true,
      elemIF: null,
      dialogVisible: false,
      orderTitle: '创建工单',
      orderId: '',
      changeCheckedArry: [],
      defaultTreeBigType: 0,
      DetailsLimit: '', // 详情弹窗页条数
      DetailsPage: '', // 详情弹窗当前页
      DetailsOnlineRate: '', // 详情弹窗状态选择
      sucTime: [], // 详情弹窗获取成功的时间
      sucData: [], // 详情弹窗获取成功的数据
      detailCounts: 0, // 详情弹窗数据条数
      detailsLoading: false // 详情弹窗数据是否正在加载
    }
  },
  methods: {
    addOpenModal() { // 创建工单
      if (this.changeCheckedArry.length > 0) {
        this.orderTitle = '创建工单'
        const treeBigType = [0, 2, 3, 9, 11]
        this.defaultTreeBigType = treeBigType[this.activeTab]
        // 根据type判断录像机or摄像机
        if (this.activeTab === 0) {
          if (this.changeCheckedArry.length > 0 && this.changeCheckedArry[0].type === 'nvr') {
            this.defaultTreeBigType = 1
          } else {
            this.defaultTreeBigType = 0
          }
        }
        this.dialogVisible = true
      } else {
        this.$notify.warning({ message: '请选择一个设备' })
      }
    },
    changeChecked(val) {
      this.changeCheckedArry = val
    },
    cancelOrder(val) { // 关闭工单弹窗
      this.dialogVisible = val
    },
    // 刷新
    refresh() {
      this.page = 1
      this.getData()
    },
    // 搜索
    search() {
      this.page = 1
      this.getData()
    },
    // 每页条数变化
    handleSizeChange(val) {
      this.page = 1
      this.limit = val
      this.getData()
    },
    // 当前页变化
    handleCurrentChange(val) {
      this.page = val
      this.getData()
    },
    changeTab(obj) {
      this.activeTab = JSON.parse(JSON.stringify(obj.index))
      this.page = 1
      this.seek = ''
      this.sub = 1
      this.onLineState = 0
      this.onLineRate = ''
      this.getData()
    },
    clickNodes(item) {
      this.orgId = item._id
      this.getData()
      this.getAllDeviceCount()
    },
    getData() {
      this.loading = true
      const params = {
        oid: this.orgId,
        seek: this.seek,
        bigtype: this.deviceTabs[this.activeTab].value,
        page: this.page,
        limit: this.limit,
        sub: this.sub,
        status: this.onLineState,
        onLineRate: this.onLineRate
      }
      getDeviceData(params).then(suc => {
        this.bscCount = Number(suc.headers['x-bsc-count'])
        this.onLineNum = Number(suc.headers['x-bsc-onlinenumber'])
        this.offLineNum = Number(suc.headers['x-bsc-offlinenumber'])
        this.deviceData = JSON.parse(JSON.stringify(suc.data))
        this.deviceData.forEach(item => {
          if (!item.offTime) {
            item.offTime = '0小时0分'
          } else {
            const time = parseInt(item.offTime)
            const hour = parseInt(time / 60)
            const minute = parseInt(time % 60)
            item.offTime = hour + '小时' + minute + '分'
          }
        })
        this.loading = false
        // this.onLineData = []
        // this.offLineData = []
        // for (let i in suc.data) {
        //   if (suc.data[i].status === 'online') {
        //     this.onLineData.push(suc.data[i])
        //   }
        //   if (suc.data[i].status === 'offline') {
        //     this.offLineData.push(suc.data[i])
        //   }
        // }
      }).catch(err => {
        console.log(err)
        this.deviceData = []
        this.$notify.error({
          message: '获取数据错误'
        })
        this.loading = false
      })
    },
    openModal(row) {
      this.selectedRow = row
      this.deviceName = row.name
      this.getDevHistoryInfoData()
    },
    getDevHistoryInfoData() {
      this.modalShow = true
      this.endTime = this.$moment().format('YYYY-MM-DD')
      let sTime = this.$moment().subtract(14, 'days').calendar()
      this.startTime = this.$moment(new Date(sTime)).format('YYYY-MM-DD')
      let params = {
        category: 'online',
        ip: this.selectedRow.ip,
        startTime: this.startTime,
        endTime: this.endTime,
        port: this.selectedRow.cport,
        bigtype: this.deviceTabs[this.activeTab].value
      }
      // this.getInfoData(params)
      this.GetPageInfoData(params)
    },
    async getInfoData(params) {
      this.detailsLoading = true
      await getDevHistoryData(params).then(suc => {
        let dateProp = []
        let dateDetailsProp = []
        suc.forEach((item, index) => {
          dateProp.push(item.t)
          dateDetailsProp[index] = []
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
              dateDetailsProp[index].push({
                // startTime: new Date(squre).getTime(), // ie11不兼容new Date('2019-06-21')格式转换
                startTime: this.$moment(squre).valueOf(),
                // endTime: new Date(item.online.g[sdex + 1]).getTime(),
                endTime: this.$moment(item.online.g[sdex + 1]).valueOf(),
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
          message: '获取数据错误'
        })
      })
    },
    filterData() { // 详情弹窗数据分页过滤
      let propsTime = []
      let propsData = []
      let normalTime = []
      let normalData = []
      let abnormalTime = []
      let abnormalData = []
      this.sucData.map((v, i) => {
        if (v.length === 1 && v[0].type === 1) {
          normalData.push(v)
          normalTime.push(this.sucTime[i])
        } else {
          abnormalData.push(v)
          abnormalTime.push(this.sucTime[i])
        }
      })
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
      if (propsData.length <= this.DetailsLimit) {
        this.timeData = propsTime
        this.detailData = propsData
      } else {
        this.timeData = propsTime.slice((this.DetailsPage - 1) * this.DetailsLimit, this.DetailsPage * this.DetailsLimit)
        this.detailData = propsData.slice((this.DetailsPage - 1) * this.DetailsLimit, this.DetailsPage * this.DetailsLimit)
      }
      this.detailCounts = propsTime.length
    },
    cancel(val) {
      // 关闭详情模块
      this.modalShow = val
      this.detailData = []
      this.timeData = []
      this.DetailsOnlineRate = ''
    },
    resize() {
      const DOMBsMain = this.$refs['bsMain']
      this.tableHeight = DOMBsMain.offsetHeight - 136
    },
    searchData(val) {
      this.detailData = []
      this.timeData = []
      let params = {
        category: 'online',
        ip: this.selectedRow.ip,
        startTime: val[0],
        endTime: val[1],
        port: this.selectedRow.cport
      }
      // this.getInfoData(params)
      this.GetPageInfoData(params)
    },
    GetPageInfoData(params) { // 分页获取详情
      let sTime = this.$moment(params.startTime)
      let eTime = this.$moment(params.endTime)
      let dDay = eTime.diff(sTime, 'day') + 1
      this.detailCounts = dDay
      let times = Math.ceil(dDay / this.DetailsLimit)
      let newStartTime, newEndTime
      if (this.DetailsOnlineRate) {
        newStartTime = params.startTime
        newEndTime = params.endTime
      } else {
        if (this.DetailsPage === times) {
          newStartTime = params.startTime
        } else {
          newStartTime = this.$moment(eTime).subtract(this.DetailsLimit * this.DetailsPage - 1, 'days').format('YYYY-MM-DD')
        }
        if (this.DetailsPage === 1) {
          newEndTime = params.endTime
        } else {
          newEndTime = this.$moment(eTime).subtract(this.DetailsLimit * (this.DetailsPage - 1), 'days').format('YYYY-MM-DD')
        }
      }
      let newParams = {
        category: 'online',
        ip: params.ip,
        startTime: newStartTime,
        endTime: newEndTime,
        port: params.port,
        bigtype: params.bigtype
      }
      this.getInfoData(newParams)
    },
    sendData(data) {
      this.DetailsLimit = data.limit
      this.DetailsPage = data.page
      this.DetailsOnlineRate = data.onlineRate
      if (this.selectedRow) {
        this.searchData(data.selDateVal)
      }
      // this.filterData()
    },
    exportCSV() {
      if (!this.elemIF) {
        this.elemIF = document.createElement('iframe')
      }
      this.elemIF.src = `${window.origin}/ops/export/device?oid=${this.orgId}&bigtype=${this.deviceTabs[this.activeTab].value}`
      this.elemIF.style.display = 'none'
      document.body.appendChild(this.elemIF)
    },
    getAllDeviceCount() {
      getDeviceCount(this.orgId).then(res => {
        this.deviceTabs.forEach((val, index) => {
          val.number = res.data[index]
        })
      }).catch(err => {
        console.log(err)
        this.$notify.error({
          message: '总条数失败！'
        })
      })
    }
  },
  destroyed() {
    this.elemIF = null
  },
  mounted() {
    const DOMBsMain = this.$refs['bsMain']
    this.$nextTick(function() {
      this.tableHeight = DOMBsMain.offsetHeight - 136
    })
    /* window.onresize = () => {
      // 固定分页位置
      this.tableHeight = DOMBsMain.offsetHeight - 136
    } */
  },
  created() {
    getOrgTree(0).then(suc => {
      this.treeData = JSON.parse(JSON.stringify(suc))
      this.orgId = suc._id
      this.getData()
      this.getAllDeviceCount()
    }).catch(err => {
      console.log(err)
    })
  },
  watch: {
    never() {
      this.sub = this.never ? 1 : 0
      this.getData()
    }
  }
}
</script>

<style lang='less'>
@import "../../assets/theme/common";
.content-main {
  overflow: hidden;
}
.select_org {
  width: 90%;
  margin: 10px auto;
}
.select_org .el-input__inner {
  border: 1px solid @operation_input_border!important;
}
.select_jg {
  line-height: 40px;
  background: @title-bg-color;
  margin: 0px;
  color: @operation_thead_color;
}
.main-section {
  background: @operation_left_background;
  display: flex;
  flex-direction: column;
}
// .section-tabs span {
//   font-size: 12px;
// }
.help-style {
  margin-left: 12px;
  font-size: 14px;
  color: #ffffff;
  cursor: pointer;
}
.help-style:hover {
  color: #fda54b;
}
.statis-info {
  margin-left: 32px;
}
.statis-info span {
  margin-left: 12px;
  font-size: 14px;
}
.content-null {
  flex: 1;
}
.section-table {
  height: calc(100% - 136px);
  width: 100%;
}
.section-footer {
  height: 40px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background: @operation_background_footer;
  padding-right: 20px;
}
.check-box {
  margin-left: 12px;
}
</style>

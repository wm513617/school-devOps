<template>
  <div class="asset-wrap" v-resize="resize">
    <aside class="left-org">
      <p class="top-title">选择机构</p>
      <Input class="search-input" placeholder="请输入内容" suffix-icon="el-icon-search" size="small" v-model="searchTreeVal" />
      <tree-search style="height: calc(100% - 92px);overflow: auto;" :treeData="treeData" :searchVal="searchTreeVal" v-model="selectTreeNode" ref="orgTree" @node-click="clickNodes">
        <template slot-scope="{ node }">
          {{node.name}}
        </template>
      </tree-search>
    </aside>
    <article class="right-table" ref="main">
      <section class="echars-bg">
        <p class="top-title">资产统计</p>
        <echart-box height="250px" :options="chartOption"></echart-box>
      </section>
      <section>
        <p class="top-title">详细信息</p>
        <header class="top-btns">
          <ul class="left-btn">
            <li><Button type="primary" icon="el-icon-edit" @click="editForm">修改</Button></li>
            <li><Button type="primary" icon="el-icon-refresh" @click="refreshTable">刷新</Button></li>
            <li><Button type="primary" icon="el-icon-download" @click="exportCSV">导出</Button></li>
            <li><Button type="primary" icon="el-icon-setting" @click="setMaintenance">设置维保</Button></li>
            <li>
              <Checkbox v-model="showChild" @change="getTableData">显示子机构设备</Checkbox>
            </li>
          </ul>
          <ul class="right-select">
            <li>资产类型
              <Select class="form-input" placeholder="请选择类型" v-model="assetsType" @change="refreshTable">
                <Option v-for="item in assetsTypeArr" :label="item.label" :value="item.value" :key="item.value"></Option>
              </Select>
            </li>
            <li>维保状态
              <Select class="form-input" placeholder="请选择类型" v-model="maintenanceState" @change="refreshTable">
                <Option v-for="item in maintenanceStateArr" :label="item.label" :value="item.value" :key="item.value"></Option>
              </Select>
            </li>
            <li><Input class="search-input" placeholder="请输入设备名称或设备ip" suffix-icon="el-icon-search" size="small" v-model="searchTableVal" @change="refreshTable(false)" /></li>
          </ul>
        </header>
        <main class="table-wrap">
          <Table size="small" :data="assetTableData" :height="tableHeight" @selection-change="selectTable" highlight-current-row>
            <table-column width="55" type="selection"></table-column>
            <table-column label="序号" type="index" min-width="100" align="center"></table-column>
            <table-column label="设备名称" prop="name" min-width="300" show-overflow-tooltip></table-column>
            <table-column label="所属机构" prop="orgName" min-width="200"></table-column>
            <table-column label="IP地址" prop="ip" min-width="150" align="center"></table-column>
            <table-column label="厂商" prop="manufacturer" min-width="200" align="center"></table-column>
            <table-column label="设备类型" prop="type" min-width="100" align="center"></table-column>
            <table-column label="建设时间" prop="constructTime" min-width="100" align="center"></table-column>
            <table-column label="过保时间" prop="endTime" min-width="100" align="center"></table-column>
            <table-column label="维保厂商" prop="maintenanceVendor" :show-overflow-tooltip="true" min-width="100" align="center"></table-column>
            <table-column label="维保状态" prop="state" min-width="100" align="center"></table-column>
            <table-column min-width="100" label="详情" align="center">
              <template slot-scope="scope">
                <i class="el-icon-document" style="cursor: pointer" @click="openDetialModal(scope.row)"></i>
              </template>
            </table-column>
          </Table>
        </main>
        <footer class="footer-page">
          <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="bscCount" background>
          </Pagination>
        </footer>
      </section>
    </article>
    <asset-model v-if="showEditModel" :tableFormData="tableFormData" :showModel="showEditModel" :firmArr="firmArr" :peoples="peopleArr" :assetsTypeArr="assetsTypeArr" :locationExtensionArr="locationExtensionArr" :position="position" @cancel="showEditModel = false" @confim="saveForm">
    </asset-model>
    <Dialog title="设置维保" width="800px" :visible="showMaintenanceModel" :show-close="false" @close="resetForm">
      <Form :model="maintenanceData" :rules="formRule" ref="ruleForm" label-width="96px" label-position="left" :inline="true" :hide-required-asterisk="true">
        <FormItem label="维保厂商" prop="maintenanceVendor">
          <Select class="form-input" placeholder="请选择维保厂商" v-model="maintenanceData.maintenanceVendor" @change="changeFirm">
            <Option v-for="(item, index) in firmArr" :label="item.maintenanceVendor" :value="item.maintenanceVendor" :key="index"></Option>
          </Select>
        </FormItem>
        <FormItem label="联系人" prop="contacts">
          <Select class="form-input" placeholder="请选择联系人" v-model="maintenanceData.contacts" @change="changePeople">
            <Option v-for="(item, index) in peopleArr" :label="item.contact" :value="item.contact" :key="index"></Option>
          </Select>
        </FormItem>
        <FormItem label="联系电话" prop="phone">
          <Input class="form-input" v-model="maintenanceData.phone" :disabled="true" />
        </FormItem>
        <FormItem label="邮件地址" prop="email">
          <Input class="form-input" v-model="maintenanceData.email" :disabled="true" />
        </FormItem>
        <FormItem label="维保开始" prop="startTime">
          <date-picker class="form-input" type="date" v-model="maintenanceData.startTime"></date-picker>
        </FormItem>
        <FormItem label="维保结束" prop="endTime">
          <date-picker class="form-input" type="date" v-model="maintenanceData.endTime"></date-picker>
        </FormItem>
      </Form>
      <div slot="footer" class="dialog-footer">
        <Button @click="saveMaintenance">确 定</Button>
        <Button @click="showMaintenanceModel = false">取 消</Button>
      </div>
    </Dialog>
    <Dialog title="资产详情" width="800px" :visible="showDetialModel" :show-close="false">
      <tabs style="height: 380px;">
        <tab-pane label="基本信息">
          <ul class="detial-ul">
            <li><span>设备名称：</span>{{detialObj.name || '无'}}</li>
            <li><span>设备类型：</span>{{detialObj.type || '无'}}</li>
            <li><span>所属机构：</span>{{detialObj.orgName || '无'}}</li>
            <li><span>厂商：</span>{{detialObj.manufacturer || '无'}}</li>
            <li><span>IP地址：</span>{{detialObj.ip || '无'}}</li>
            <li><span>建设时间：</span>{{detialObj.constructTime || '无'}}</li>
            <li><span>安装位置：</span>{{detialObj.InstallPosition || '无'}}</li>
            <li><span>经度：</span>{{detialObj.longitude || '无'}}</li>
            <li><span>纬度：</span>{{detialObj.latitude || '无'}}</li>
          </ul>
        </tab-pane>
        <tab-pane label="扩展信息">
          <ul class="detial-ul">
            <li><span>摄像机类型：</span>{{detialObj.monitortype || '无'}}</li>
            <li><span>警区：</span>{{detialObj.district || '无'}}</li>
            <li><span>位置类型扩展：</span>{{detialObj.locationExtension || '无'}}</li>
            <li><span>安装位置：</span>{{detialObj.site || '无'}}</li>
            <li><span>摄像机用途：</span>{{detialObj.usage || '无'}}</li>
            <li><span>摄像机补光：</span>{{detialObj.fill || '无'}}</li>
            <li><span>监视方位：</span>{{detialObj.monitoPosition || '无'}}</li>
            <li><span>支持国标：</span>{{detialObj.supportGB || '无'}}</li>
            <li><span>是否可控：</span>{{detialObj.controllable || '无'}}</li>
          </ul>
        </tab-pane>
        <tab-pane label="维保信息">
          <ul class="detial-ul">
            <li><span>维保厂商：</span>{{detialObj.maintenanceVendor || '无'}}</li>
            <li><span>联系人：</span>{{detialObj.contacts || '无'}}</li>
            <li><span>联系电话：</span>{{detialObj.phone || '无'}}</li>
            <li><span>邮件地址：</span>{{detialObj.email || '无'}}</li>
            <li><span>维保开始：</span>{{detialObj.startTime || '无'}}</li>
            <li><span>维保结束：</span>{{detialObj.endTime || '无'}}</li>
          </ul>
        </tab-pane>
      </tabs>
      <div slot="footer" class="dialog-footer">
        <Button @click="showDetialModel = false">确 定</Button>
      </div>
    </Dialog>
  </div>
</template>

<script>
import TreeSearch from '@/components/BStree/TreeSearch'
import echartBox from '@/components/echartBox'
import assetModel from './assetsManage/editModel'
import { getOrgTree } from '@/http/org'
import { getChartsList, getAssetsTable, getAssetsRowDetial, setAssetsRow, batSetModification } from '@/http/assetsManage.api'
import { getCompanyList } from '@/http/repairCompany.api'
export default {
  components: {
    TreeSearch,
    echartBox,
    assetModel
  },
  data() {
    return {
      showChild: true,
      showEditModel: false,
      showMaintenanceModel: false,
      showDetialModel: false,
      treeData: {},
      searchTreeVal: '',
      // 在保数据
      overInsuranceData: [],
      // 过保数据
      underWarrantyData: [],
      searchTableVal: '',
      assetTableData: [],
      tableHeight: '100%',
      selectTableRow: [],
      selectTreeNode: {},
      rootTreeId: '',
      tableFormData: {
        name: '', // 设备名称
        type: '', // 设备类型
        org: '', // 所属机构
        firm: '', // 厂商
        ip: '',
        version: '', // 设备型号
        constructTime: '', // 建设时间
        InstallPosition: '', // 安装位置
        longitude: '', // 经度
        latitude: '', // 纬度
        monitortype: '', // 摄像机类型
        district: '', // 警区
        locationExtension: '', // 位置扩展
        site: '', // 安装位置（select）
        usage: '', // 摄像机用途
        fill: '', // 摄像机补光
        monitoPosition: '', // 监视方位
        supportGB: '', // 支持国标
        controllable: '', // 是否可控
        maintenanceVendor: '', // 维保厂商
        contacts: '',
        phone: '',
        email: '',
        startTime: '',
        endTime: ''
      },
      firmArr: [], // 维保厂商
      peopleArr: [], // 联系人
      maintenanceData: {
        maintenanceVendor: '',
        contacts: '',
        phone: '',
        email: '',
        startTime: new Date(),
        endTime: new Date(this.$moment().add(5, 'year').calendar())
      },
      formRule: {
        maintenanceVendor: [{ required: true, message: '请选择维保厂商', trigger: 'change' }],
        contacts: [{ required: true, message: '请选择联系人', trigger: 'change' }],
        startTime: [{ required: true, type: 'date', message: '请选择日期', trigger: 'change' }],
        endTime: [{ required: true, type: 'date', message: '请选择日期', trigger: 'change' }]
      },
      assetsType: '0', // 资产类型
      maintenanceState: '', // 维保状态
      detialObj: {}, // table详情数据
      bscCount: 0, // 数据总计条数
      page: 1, // 当前页
      limit: 100, // 页大小
      elemIF: null,
      colorEchart: '#333' // Echart字体颜色打包前手动切换 陕西商务厅是#333，  普通版是 #fff
    }
  },
  computed: {
    chartOption() {
      return {
        color: ['#FD7C55', '#88D0F8'],
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const item = params
            return `
                  <p>在保：${item[0].value}</p>
                  <p>过保：${item[1].value}</p>
                  总数：${item[1].value + item[0].value}
                  `
          }
        },
        legend: {
          data: ['过保设备', '在保设备'],
          textStyle: {
            color: this.colorEchart
          }
        },
        grid: {
          top: '10%',
          left: '3%',
          right: 70,
          bottom: '5%',
          containLabel: true
        },
        toolbox: {
          right: '80px',
          show: true,
          iconStyle: {
            borderColor: this.colorEchart
          },
          feature: {
            // dataView: {
            //   show: true,
            //   readOnly: false
            // },
            // magicType: {
            //   show: true,
            //   type: ['line', 'bar']
            // },
            // restore: {
            //   show: true
            // },
            myRefresh: {
              show: true,
              title: '刷新',
              icon: 'path://m702.2725,747.5927c-52.8855,37.5183 -114.7638,56.3272 -178.0214,55.4609c-8.364,-0.0881 -16.6707,-0.5274 -24.875,-1.2585c-3.3536,-0.3205 -6.7092,-0.8765 -10.0782,-1.3015c-6.4604,-0.8663 -12.9352,-1.7428 -19.2215,-2.9747c-3.8973,-0.7475 -7.7046,-1.7582 -11.5128,-2.6522c-6.1676,-1.4664 -12.3075,-2.945 -18.3265,-4.7606c-2.901,-0.9083 -5.7272,-1.9487 -8.5985,-2.9297c-6.9437,-2.3583 -13.8588,-4.7892 -20.5967,-7.6462c-1.5227,-0.6175 -2.988,-1.3455 -4.5117,-2.0367c-7.852,-3.5021 -15.6457,-7.1772 -23.1465,-11.308c-0.3656,-0.1915 -0.6738,-0.3523 -1.0394,-0.5407c-25.4464,-14.1527 -48.7393,-31.8188 -69.1599,-52.4605c-0.3082,-0.3205 -0.6451,-0.7035 -0.981,-1.0691c-6.3437,-6.4471 -12.3935,-13.185 -18.1514,-20.2158c-1.2012,-1.495 -2.3736,-3.1058 -3.5891,-4.6438c-41.5601,-52.6479 -66.6255,-119.2745 -66.6255,-191.7614l70.4983,0c1.8207,0 3.583,-0.9759 4.5066,-2.6911c0.9247,-1.7152 0.77,-3.7233 -0.2314,-5.2449l-118.5036,-179.9711c-0.9155,-1.3896 -2.4893,-2.304 -4.2762,-2.304s-3.3618,0.9155 -4.2762,2.304l-118.5056,179.9669c-1.0015,1.5217 -1.1551,3.5297 -0.2314,5.2449c0.9247,1.7152 2.686,2.6911 4.5076,2.6911l70.51264,0c0,85.2163 26.2369,164.2045 70.8147,229.5122c0.5427,0.9103 0.938,1.877 1.538,2.7863c4.6141,6.6785 9.7423,12.8461 14.6934,19.1601c1.8463,2.388 3.5748,4.8476 5.4938,7.1905c7.296,8.9661 15.0446,17.3896 23.0144,25.6225c0.7619,0.8202 1.4653,1.6251 2.2129,2.3583c26.75,27.1155 57.001,49.9702 89.9031,68.2373c0.8499,0.514 1.6998,1.0424 2.6368,1.5247c9.4781,5.1548 19.2195,9.814 29.0939,14.2244c2.4617,1.068 4.864,2.2702 7.3687,3.326c8.4388,3.5451 17.11,6.6499 25.856,9.6102c4.1308,1.4213 8.233,2.8713 12.4221,4.1738c7.6329,2.2856 15.4409,4.2045 23.3216,6.0938c5.2152,1.2308 10.3997,2.5641 15.7194,3.5891c2.2118,0.4547 4.2916,1.1438 6.4614,1.4797c7.4117,1.3332 14.8828,2.0797 22.3099,2.988c2.6808,0.3236 5.3176,0.7782 7.9995,1.0691c13.3458,1.3343 26.6465,2.2118 39.935,2.2118c81.3189,0 160.6605,-25.1812 228.7196,-73.4515c21.6832,-15.4245 26.9722,-45.6899 11.7801,-67.6792c-15.23604,-22.0323 -45.17874,-27.3499 -66.85994,-11.9244m225.6446,-252.1027c-0.044,-84.951 -26.1202,-163.7806 -70.4778,-228.9551c-0.6451,-1.1131 -1.0854,-2.2415 -1.8156,-3.2819c-5.5081,-7.9688 -11.5313,-15.3969 -17.5206,-22.8383c-0.6881,-0.9083 -1.3322,-1.8606 -2.0654,-2.7546c-40.5955,-49.8668 -91.5589,-88.3804 -149.3217,-113.5616c-1.5985,-0.7035 -3.1642,-1.4797 -4.7749,-2.1832c-9.216,-3.838 -18.6655,-7.2366 -28.1559,-10.4448c-3.4284,-1.1428 -6.783,-2.4023 -10.284,-3.4427c-8.277,-2.5344 -16.6717,-4.5998 -25.1402,-6.5782c-4.6725,-1.0988 -9.345,-2.2999 -14.078,-3.2369c-2.3429,-0.4547 -4.5548,-1.1571 -6.869,-1.5821c-6.314,-1.0988 -12.6577,-1.5821 -18.986,-2.4166c-4.395,-0.5571 -8.6733,-1.2452 -13.097,-1.6998c-10.6353,-0.9964 -21.1845,-1.4203 -31.7307,-1.6108c-1.9343,0 -3.7939,-0.3082 -5.7129,-0.3082c-0.3512,0 -0.6728,0.1034 -1.025,0.1321c-81.2176,0.0585 -160.383,24.8895 -228.3562,73.1004c-21.7395,15.3815 -27.0285,45.6765 -11.8221,67.6803c15.1767,22.0037 45.1635,27.3357 66.859,11.9091c52.5036,-37.2234 113.7531,-56.063 176.5704,-55.4916c9.0388,0.0584 17.9313,0.512 26.7213,1.3476c2.7095,0.3082 5.3914,0.7178 8.0855,1.0547c7.2233,0.894 14.3862,1.9333 21.4456,3.3403c3.1212,0.6154 6.1983,1.4203 9.2426,2.1248c6.9304,1.5811 13.8455,3.2809 20.6131,5.3473c2.1381,0.6881 4.2465,1.4643 6.3857,2.1678c7.721,2.5631 15.3231,5.3176 22.7963,8.4675c0.7598,0.3215 1.538,0.7178 2.2702,1.025c44.7386,19.4836 83.9854,49.4715 114.603,87.0031c0.1915,0.2191 0.3799,0.513 0.5571,0.7322c43.0981,53.119 69.0432,121.0184 69.0719,194.9542l-70.528,0c-1.8207,0 -3.583,0.9759 -4.5066,2.6911s-0.77,3.7233 0.2324,5.2449l118.5321,179.9537c0.9155,1.3885 2.4893,2.304 4.2772,2.304c1.7869,-0.001 3.3608,-0.9165 4.2752,-2.305l118.4768,-179.9537c1.0025,-1.5217 1.1561,-3.5287 0.2314,-5.2449c-0.9236,-1.7152 -2.686,-2.6911 -4.5066,-2.6911l-70.47264,0l0.00004,0.001z',
              onclick: () => {
                this.getChart()
              }
            }
            // saveAsImage: {
            //   show: true
            // }
          }
        },
        calculable: true,
        xAxis: [
          {
            type: 'category',
            data: ['摄像机', '录像机', '报警主机', '消防主机', '报警输入', '消防输入', '报警箱', '闸机', '解码器', '服务器', '网络键盘', '拼接控制器', '人脸抓拍机', '结构化相机', '门禁点位'],
            axisLine: {
              lineStyle: {
                color: this.colorEchart
              }
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: this.colorEchart
              }
            }
          }
        ],
        series: [
          {
            name: '在保设备',
            type: 'bar',
            stack: 'number',
            data: this.overInsuranceData
          },
          {
            name: '过保设备',
            type: 'bar',
            stack: 'number',
            data: this.underWarrantyData
          }
        ]
      }
    },
    assetsTypeArr() {
      return [
        // {
        //   label: '全部',
        //   value: ''
        // },
        {
          label: '摄像机',
          value: '0'
        },
        {
          label: '录像机',
          value: '1'
        },
        {
          label: '报警主机',
          value: '2'
        },
        {
          label: '消防主机',
          value: '3'
        },
        {
          label: '报警输入',
          value: '4'
        },
        {
          label: '消防输入',
          value: '5'
        },
        {
          label: '报警箱',
          value: '6'
        },
        {
          label: '闸机',
          value: '7'
        },
        {
          label: '解码器',
          value: '8'
        },
        {
          label: '服务器',
          value: '9'
        },
        {
          label: '网络键盘',
          value: '10'
        },
        {
          label: '拼接控制器',
          value: '11'
        },
        {
          label: '人脸抓拍机',
          value: '12'
        },
        {
          label: '结构化相机',
          value: '13'
        },
        {
          label: '门禁点位',
          value: '14'
        }
      ]
    },
    maintenanceStateArr() {
      return [
        {
          label: '全部',
          value: ''
        },
        {
          label: '过保',
          value: 0
        },
        {
          label: '在保',
          value: 1
        }
      ]
    },
    locationExtensionArr() {
      return [
        {
          label: '空',
          value: 0
        },
        {
          label: '省际检查站',
          value: 1
        },
        {
          label: '党政机关',
          value: 2
        },
        {
          label: '车站码头',
          value: 3
        },
        {
          label: '中心广场',
          value: 4
        },
        {
          label: '体育场馆',
          value: 5
        },
        {
          label: '商业中心',
          value: 6
        },
        {
          label: '宗教场所',
          value: 7
        },
        {
          label: '校园周边',
          value: 8
        },
        {
          label: '治安复杂区域',
          value: 9
        },
        {
          label: '交通干线',
          value: 10
        }
      ]
    },
    position() {
      return [
        {
          label: '东面',
          value: 1
        },
        {
          label: '西面',
          value: 2
        },
        {
          label: '南面',
          value: 3
        },
        {
          label: '北面',
          value: 4
        },
        {
          label: '东南',
          value: 5
        },
        {
          label: '东北',
          value: 6
        },
        {
          label: '西南',
          value: 7
        },
        {
          label: '西北',
          value: 8
        }
      ]
    }
  },
  methods: {
    changeFirm() {
      this.firmArr.forEach(obj => {
        if (obj.maintenanceVendor === this.maintenanceData.maintenanceVendor) {
          this.peopleArr = obj.contacts
        }
      })
      this.maintenanceData.contacts = ''
      this.maintenanceData.phone = ''
      this.maintenanceData.email = ''
    },
    changePeople() {
      this.peopleArr.forEach(obj => {
        if (obj.contact === this.maintenanceData.contacts) {
          this.maintenanceData.phone = obj.phone
          this.maintenanceData.email = obj.email
        }
      })
    },
    getChart() {
      getChartsList({
        oid: this.selectTreeNode._id,
        isroot: this.selectTreeNode.isroot ? 1 : 0,
        sub: this.showChild ? 1 : 0
      }).then(res => {
        this.formatChartData(res)
      }).catch(err => {
        console.log('getChartsList', err)
        this.$notify.error({
          message: '获取图表数据失败'
        })
      })
    },
    formatChartData(arr) {
      this.overInsuranceData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      this.underWarrantyData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      Object.keys(arr).forEach(type => {
        switch (type) {
          case 'vidicon':
            this.overInsuranceData[0] = arr[type].under
            this.underWarrantyData[0] = arr[type].sum - arr[type].under
            break
          case 'video':
            this.overInsuranceData[1] = arr[type].under
            this.underWarrantyData[1] = arr[type].sum - arr[type].under
            break
          case 'alarmHost':
            this.overInsuranceData[2] = arr[type].under
            this.underWarrantyData[2] = arr[type].sum - arr[type].under
            break
          case 'firemenHost':
            this.overInsuranceData[3] = arr[type].under
            this.underWarrantyData[3] = arr[type].sum - arr[type].under
            break
          case 'alarmInput':
            this.overInsuranceData[4] = arr[type].under
            this.underWarrantyData[4] = arr[type].sum - arr[type].under
            break
          case 'firemenInput':
            this.overInsuranceData[5] = arr[type].under
            this.underWarrantyData[5] = arr[type].sum - arr[type].under
            break
          case 'alarmBox':
            this.overInsuranceData[6] = arr[type].under
            this.underWarrantyData[6] = arr[type].sum - arr[type].under
            break
          case 'gate':
            this.overInsuranceData[7] = arr[type].under
            this.underWarrantyData[7] = arr[type].sum - arr[type].under
            break
          case 'decoder':
            this.overInsuranceData[8] = arr[type].under
            this.underWarrantyData[8] = arr[type].sum - arr[type].under
            break
          case 'server':
            this.overInsuranceData[9] = arr[type].under
            this.underWarrantyData[9] = arr[type].sum - arr[type].under
            break
          case 'keyboard':
            this.overInsuranceData[10] = arr[type].under
            this.underWarrantyData[10] = arr[type].sum - arr[type].under
            break
          case 'splicer':
            this.overInsuranceData[11] = arr[type].under
            this.underWarrantyData[11] = arr[type].sum - arr[type].under
            break
          case 'face':
            this.overInsuranceData[12] = arr[type].under
            this.underWarrantyData[12] = arr[type].sum - arr[type].under
            break
          case 'structuring':
            this.overInsuranceData[13] = arr[type].under
            this.underWarrantyData[13] = arr[type].sum - arr[type].under
            break
          case 'point':
            this.overInsuranceData[14] = arr[type].under
            this.underWarrantyData[14] = arr[type].sum - arr[type].under
            break
        }
      })
    },
    // 树相关
    clickNodes(node) {
      this.selectTreeNode = node
      this.refreshTable(false)
      this.getChart()
    },
    // 修改表单
    editForm() {
      if (this.selectTableRow.length > 1) {
        return this.$notify.warning({
          message: '一次只能修改一个!'
        })
      } else if (this.selectTableRow.length < 1) {
        return this.$notify.warning({
          message: '请选择修改项!'
        })
      }
      getAssetsRowDetial({
        type: this.assetsType,
        id: this.selectTableRow[0]._id
      }).then(res => {
        this.tableFormData = { ...this.tableFormData, ...this.selectTableRow[0], ...res[0] }
        this.tableFormData.constructTime = this.tableFormData.constructTime ? this.$moment(new Date(this.tableFormData.constructTime * 1000)).format('YYYY-MM-DD') : ''
        this.tableFormData.startTime = this.tableFormData.startTime ? this.$moment(new Date(this.tableFormData.startTime * 1000)).format('YYYY-MM-DD') : ''
        this.tableFormData.endTime = this.tableFormData.endTime ? this.$moment(new Date(this.tableFormData.endTime * 1000)).format('YYYY-MM-DD') : ''
        this.showEditModel = true
      })
    },
    saveForm(res) {
      const result = {
        constructTime: res.constructTime && new Date(res.constructTime).getTime() / 1000,
        longitude: res.longitude,
        latitude: res.latitude,
        InstallPosition: res.InstallPosition,
        district: res.district,
        locationExtension: res.locationExtension,
        site: res.site,
        usage: res.usage,
        fill: res.fill,
        monitoPosition: res.monitoPosition,
        supportGB: res.supportGB,
        controllable: res.controllable,
        maintenanceVendor: res.maintenanceVendor,
        contacts: res.contacts,
        phone: res.phone,
        email: res.email,
        startTime: res.startTime && new Date(res.startTime).getTime() / 1000,
        endTime: res.endTime && new Date(res.endTime).getTime() / 1000
      }
      setAssetsRow(this.assetsType, this.selectTableRow[0]._id, result).then(() => {
        this.getTableData()
        this.$notify.success({
          message: '修改成功'
        })
        this.showEditModel = false
      }).catch(err => {
        this.$notify.error({
          message: '修改失败'
        })
        console.log('setAssetsRow', err)
      })
    },
    // 设置维保
    resetForm() {
      this.$refs['ruleForm'].resetFields()
    },
    setMaintenance() {
      if (this.selectTableRow.length < 1) {
        return this.$notify.warning({
          message: '请选择维保内容！'
        })
      }
      this.showMaintenanceModel = true
    },
    saveMaintenance() {
      this.$refs['ruleForm'].validate((v) => {
        if (v) {
          const idArr = this.selectTableRow.map(obj => {
            return obj._id
          })
          let endTime = this.maintenanceData.endTime.getTime()
          let startTime = this.maintenanceData.startTime.getTime()
          batSetModification(
            this.assetsType, {
              ids: idArr,
              maintenance: {
                ...this.maintenanceData,
                endTime: parseInt(endTime / 1000),
                startTime: parseInt(startTime / 1000)
              } }).then(() => {
            this.getTableData()
            this.showMaintenanceModel = false
            this.$notify.success({
              message: '设置成功'
            })
          }).catch(err => {
            this.$notify.error({
              message: '设置失败'
            })
            console.log('batSetModification', err)
          })
        }
      })
    },
    // table相关
    selectTable(arr) {
      this.selectTableRow = arr
    },
    formatTableData(arr) {
      if (!arr) {
        this.assetTableData = []
        return
      }
      this.assetTableData = arr.map(obj => {
        this.assetsTypeArr.forEach(type => {
          if (obj.type === type.value) {
            obj.type = type.label
          }
        })
        return {
          ...obj,
          constructTime: obj.constructTime && this.$moment(obj.constructTime * 1000).format('YYYY-MM-DD'),
          endTime: obj.endTime && this.$moment(obj.endTime * 1000).format('YYYY-MM-DD'),
          state: obj.state === 1 ? '在保' : '过保'
        }
      })
    },
    refreshTable(isShowNotice) {
      getAssetsTable(
        {
          oid: this.selectTreeNode._id,
          isroot: this.selectTreeNode.isroot ? 1 : 0,
          sub: this.showChild ? 1 : 0,
          type: this.assetsType,
          seek: this.searchTableVal,
          state: this.maintenanceState,
          page: this.page,
          limit: this.limit
        }
      ).then((res) => {
        this.bscCount = +res.headers['x-bsc-count']
        this.formatTableData(res.data.assetsList)
        if (isShowNotice) {
          this.$notify.success({
            message: '刷新成功'
          })
        }
      }).catch(err => {
        console.log(err)
        this.$notify.error({
          message: '获取数据失败'
        })
      })
    },
    exportCSV() {
      if (!this.elemIF) {
        this.elemIF = document.createElement('iframe')
      }
      this.elemIF.src = `${window.origin}/ops/assets/assetseExport?oid=${this.rootTreeId}&type=${this.assetsType}`
      this.elemIF.style.display = 'none'
      document.body.appendChild(this.elemIF)
    },
    concatObj(res, obj) {
      this.locationExtensionArr.forEach(obj => {
        if (res.locationExtension === obj.value) {
          res.locationExtension = obj.label
        }
      })
      return {
        ...res,
        ...obj,
        constructTime: res.constructTime || '',
        endTime: res.endTime || '',
        startTime: res.startTime || ''
      }
    },
    formatDetial(obj) {
      Object.keys(obj).forEach(key => {
        switch (key) {
          case 'site':
            if (this.detialObj[key] === 1) {
              this.detialObj[key] = '室内'
            } else if (this.detialObj[key] === 2) {
              this.detialObj[key] = '室外'
            }
            break
          case 'usage':
            if (this.detialObj[key] === 1) {
              this.detialObj[key] = '治安'
            } else if (this.detialObj[key] === 2) {
              this.detialObj[key] = '交通'
            } else if (this.detialObj[key] === 3) {
              this.detialObj[key] = '重点'
            }
            break
          case 'fill':
            if (this.detialObj[key] === 0) {
              this.detialObj[key] = '无补光'
            } else if (this.detialObj[key] === 1) {
              this.detialObj[key] = '红外补光'
            } else {
              this.detialObj[key] = '白光补光'
            }
            break
          case 'supportGB':
            if (this.detialObj[key] === 1) {
              this.detialObj[key] = '是'
            } else if (this.detialObj[key] === 2) {
              this.detialObj[key] = '否'
            }
            break
          case 'controllable':
            if (this.detialObj[key] === 1) {
              this.detialObj[key] = '可控'
            } else if (this.detialObj[key] === 2) {
              this.detialObj[key] = '不可控'
            }
            break
          case 'monitoPosition':
            this.position.forEach(obj => {
              if (this.detialObj[key] === +obj.value) {
                this.detialObj[key] = obj.label
              }
            })
            break
        }
      })
    },
    openDetialModal(obj) {
      getAssetsRowDetial({
        type: this.assetsType,
        id: obj._id
      }).then(res => {
        console.log(obj, 'obj')
        console.log(res, 'res')
        // if (res[0].constructTime) {
        //   res[0].constructTime = this.$moment(new Date(res[0].constructTime)).format('YYYY-MM-DD')
        // }
        // if (!res[0].startTime) {
        //   res[0].startTime = res[0].constructTime
        // }
        // res[0].constructTime = res[0].constructTime ? this.$moment(new Date(res[0].constructTime*1000)).format('YYYY-MM-DD') : ''
        // res[0].startTime = res[0].startTime ? this.$moment(new Date(res[0].startTime*1000)).format('YYYY-MM-DD') : ''
        // res[0].endTime = res[0].endTime ? this.$moment(new Date(res[0].startTime*1000)).format('YYYY-MM-DD') : ''
        // if (!res[0].endTime && res[0].startTime) {
        //   res[0].endTime = new Date(res[0].constructTime)
        // }
        this.detialObj = this.concatObj(res[0], obj)
        this.detialObj.constructTime = this.detialObj.constructTime ? this.$moment(new Date(this.detialObj.constructTime * 1000)).format('YYYY-MM-DD') : ''
        this.detialObj.startTime = this.detialObj.startTime ? this.$moment(new Date(this.detialObj.startTime * 1000)).format('YYYY-MM-DD') : ''
        this.detialObj.endTime = this.detialObj.endTime ? this.$moment(new Date(this.detialObj.endTime * 1000)).format('YYYY-MM-DD') : ''
        this.formatDetial(this.detialObj)
        this.showDetialModel = true
      })
    },
    getTableData() {
      const params = {
        oid: this.selectTreeNode._id,
        isroot: this.selectTreeNode.isroot ? 1 : 0,
        sub: this.showChild ? 1 : 0,
        type: this.assetsType,
        seek: this.searchTableVal,
        state: this.maintenanceState,
        page: this.page,
        limit: this.limit
      }
      getAssetsTable(params).then((res) => {
        this.bscCount = +res.headers['x-bsc-count']
        console.log(res)
        this.formatTableData(res.data.assetsList)
      }).catch(err => {
        console.log(err)
        this.$notify.error({
          message: '获取数据失败'
        })
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
      this.tableHeight = this.$refs['main'].offsetHeight - 420
    }
  },
  created() {
    getCompanyList().then(res => {
      this.firmArr = res.data
    })
    getOrgTree(0).then(res => {
      this.treeData = res
      this.rootTreeId = res._id
      this.selectTreeNode = res
      this.getChart()
      this.refreshTable(false)
    }).catch(() => {
      this.$notify.error({
        message: '获取树机构失败'
      })
    })
    this.$nextTick(() => {
      this.resize()
    })
  },
  destroyed() {
    this.elemIF = null
  }
}
</script>
<style lang="less">
@import '../../assets/theme/common';
.asset-wrap {
  .el-input .el-input__inner {
    font-size: 12px;
  }
}
.echars-bg {
  background:@echars-background;
}
</style>
<style scoped lang="less">
@import '../../assets/theme/common';

.asset-wrap {
  width: 100%;
  height: 100%;
  padding: 20px 0;
  display: flex;
  .detial-ul {
    display: flex;
    flex-wrap: wrap;
    li {
      width: 346px;
      height: 40px;
      line-height: 40px;
      margin: 0 10px 20px 20px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      span {
        display: inline-block;
        width: 100px;
        margin-right: 10px;
      }
    }
  }
  .form-input {
    width: 220px;
    margin-right: 24px;
  }
}

.top-title {
  color: @operation_thead_color;
  line-height: 40px;
  background: @title-top-background;
}

.search-input {
  width: 90%;
  margin: 10px 0;
}

.left-org {
  width: 272px;
  min-width: 272px;
  margin-right: 16px;
  background-color: @main-color;
  text-align: center;
  overflow: hidden;
}

.right-table {
  flex: 1;
  background-color: @main-color;
  .top-title {
    padding-left: 24px;
  }
  .top-btns {
    .left-btn,
    .right-select {
      font-size: 12px;
      display: flex;
      align-items: center;
      height: 50px;
      padding-left: 8px;
      li {
        display: inline-block;
        // margin-left: 8px;
        cursor: pointer;
      }
    }
    .left-btn {
      float: left;
    }
    .right-select {
      float: right;
    }
  }
  .table-wrap {
    width: 100%;
  }
  .footer-page {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    background: @table-header-bg-color;
    padding-right: 20px;
  }
}
</style>

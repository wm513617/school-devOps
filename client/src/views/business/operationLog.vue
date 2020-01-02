<template>
  <div class="log-wrap" v-resize="resize" ref="wrap">
    <header class="header-wrap">
      <ul>
        <li>开始时间&nbsp;
          <date-picker class="form-input" type="datetime" v-model="searchObj.startTime" @change="getTableData"></date-picker>
        </li>
        <li>结束时间&nbsp;
          <date-picker class="form-input" type="datetime" v-model="searchObj.overTime" @change="getTableData"></date-picker>
        </li>
        <li>日志类型&nbsp;
          <Select class="form-input" style="line-height: normal" v-model="searchObj.type" @change="getTableData" size="mini">
            <Option v-for="(t, index) in typeArr" :label="t.label" :value="t.value" :key="index"></Option>
          </Select>
        </li>
        <li><Input class="form-input" placeholder="关键字" suffix-icon="el-icon-search" v-model="searchObj.seek" @click.native="searchTable" /></li>
        <li><Button type="primary" icon="el-icon-search" @click="searchTable">查询</Button></li>
        <li><Button type="primary" icon="el-icon-download" @click="exportCSV">导出</Button></li>
      </ul>
    </header>
    <main class="main">
      <Table size="small" :data="logTableData" :height="tableHeight" highlight-current-row>
        <table-column label="序号" type="index" min-width="100" align="center"></table-column>
        <table-column label="时间" min-width="100" align="center">
          <template slot-scope="scope">{{$moment(scope.row.eventTime * 1000).format('YYYY-MM-DD HH:mm:ss')}}</template>
        </table-column>
        <table-column label="设备名称" prop="name" min-width="300" show-overflow-tooltip></table-column>
        <table-column label="IP地址" prop="ip" min-width="150" align="center"></table-column>
        <table-column label="设备类型" prop="deviceType" min-width="100" align="center"></table-column>
        <table-column label="所属机构" prop="orgName" min-width="200"></table-column>
        <table-column label="日志类型" prop="type" min-width="150"></table-column>
        <table-column min-width="100" label="日志详情" align="center">
          <template slot-scope="scope">
            <i v-if="scope.row.type === '7种视频诊断异常'" class="el-icon-document" style="cursor: pointer" @click="openDetialModal(scope.row)"></i>
          </template>
        </table-column>
      </Table>
    </main>
    <footer class="footer-page">
      <Pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :page-sizes="[25, 50, 100, 200]"
        :page-size="limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="bscCount" background>
      </Pagination>
    </footer>
    <Dialog title="日志详情" width="520px" :visible="showDetialModel" :show-close="false">
      <main>
        <ul class="detial-ul">
          <li>
            检测时间：{{$moment(detialObj.eventTime * 1000).format('YYYY-MM-DD HH:mm:ss') || '无'}}
          </li>
          <li>
            设备名称：{{detialObj.name || '无'}}
          </li>
          <li>
            所属机构：{{detialObj.orgName || '无'}}
          </li>
          <li>
            IP地址：{{detialObj.ip || '无'}}
          </li>
          <li>
            在线状态：{{detialObj.status ? '在线' : '离线'}}
          </li>
          <li>
            诊断项：{{detialObj.diagnosisItem || '无'}}
          </li>
          <li>
            异常项：{{detialObj.exceptionItem || '无'}}
          </li>
          <li>
            诊断截图：
            <img v-if="detialObj.pic && detialObj.pic !== ''" :src="detialObj.pic" alt="">
            <span v-else>无</span>
          </li>
        </ul>
      </main>
      <div slot="footer" class="dialog-footer">
        <Button @click="showDetialModel = false">关 闭</Button>
      </div>
    </Dialog>
  </div>
</template>

<script>
import { getOperationLogList, getOperationLogDetial } from '@/http/operationLog.api'
export default {
  components: {

  },
  data() {
    return {
      logTableData: [],
      tableHeight: '100%',
      showDetialModel: false,
      searchObj: {
        startTime: new Date(new Date().setHours(0, 0, 0, 0)),
        overTime: new Date(),
        type: '1',
        seek: ''
      },
      typeArr: [
        // {
        //   label: '全部',
        //   value: ''
        // },
        {
          label: '设备上线',
          value: '0'
        },
        {
          label: '设备离线',
          value: '1'
        },
        {
          label: '录像缺失',
          value: '2'
        },
        {
          label: '视频流中断',
          value: '3'
        },
        {
          label: '存储写入失败',
          value: '4'
        },
        {
          label: '服务上线',
          value: '5'
        },
        {
          label: '服务离线',
          value: '6'
        },
        {
          label: '7种视频诊断异常',
          value: '7'
        }
      ],
      detialObj: {},
      bscCount: 0,
      limit: 100,
      page: 1,
      elemIF: null
    }
  },
  methods: {
    openDetialModal(obj) {
      if (obj.type === '7种视频诊断异常') {
        getOperationLogDetial({
          startTime: new Date(this.searchObj.startTime).getTime() / 1000,
          overTime: new Date(this.searchObj.overTime).getTime() / 1000,
          url: obj.url,
          time: obj.eventTime
        }).then((res) => {
          this.detialObj = {
            ...obj,
            ...res
          }
          this.showDetialModel = true
        }).catch(err => {
          this.$notify.error({
            message: '获取数据失败'
          })
          console.log('getOperationLogDetial', err)
        })
      }
    },
    getTableData() {
      if (this.searchObj.startTime.getTime() >= this.searchObj.overTime.getTime()) {
        this.$notify.warning({
          message: '结束时间必须大于开始时间！'
        })
        return
      }
      getOperationLogList({
        ...this.searchObj,
        startTime: this.searchObj.startTime.getTime() / 1000,
        overTime: this.searchObj.overTime.getTime() / 1000,
        page: this.page,
        limit: this.limit
      }).then(res => {
        this.bscCount = +res.headers['x-bsc-count']
        if (res.data.length && res.data.length > 0) {
          this.logTableData = res.data.map(obj => {
            this.typeArr.forEach(t => {
              if (obj.type === t.value) {
                obj.type = t.label
              }
            })
            return obj
          })
        } else {
          this.logTableData = []
        }
      })
    },
    searchTable() {
      this.getTableData()
    },
    exportCSV() {
      if (!this.elemIF) {
        this.elemIF = document.createElement('iframe')
      }
      let startTime = new Date(this.searchObj.startTime).getTime() / 1000
      let overTime = new Date(this.searchObj.overTime).getTime() / 1000
      this.elemIF.src = `${window.origin}/ops/log/export?startTime=${startTime}&overTime=${overTime}&type=${this.searchObj.type}`
      this.elemIF.style.display = 'none'
      document.body.appendChild(this.elemIF)
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
      this.tableHeight = this.$refs['wrap'].offsetHeight - 144
    }
  },
  created() {
    this.getTableData()
    this.$nextTick(() => {
      this.resize()
    })
  },
  destroyed() {
    this.elemIF = null
  }
}
</script>

<style scoped lang="less">
@import '../../assets/theme/common';
.log-wrap {
  width: 100%;
  height: 100%;
  padding: 20px 0;
  display: flex;
  flex-flow: column;
}

.header-wrap {
  padding: 12px 20px;
  background-color: @main-color;
  line-height: 40px;
  ul {
    li {
      display: inline-block;
      margin-right: 20px;
    }
  }
  .form-input {
    width: 300px;
  }
}

.main {
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
.detial-ul {
  padding-left: 24px;
  li {
    line-height: 40px;
  }
  img {
    display: block;
    width: 100%;
  }
}
</style>

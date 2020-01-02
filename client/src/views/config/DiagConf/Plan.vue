<template>
  <div class="diagnosis-configuration content content-style" v-resize="resize">
    <div class="content">
      <div class="operating-space">
        <Button type="primary" icon="el-icon-plus" @click="addDiagnosisPlan" :loading="addDiagnosisStatus">添加</Button>
        <Button type="primary" icon="el-icon-edit" @click="modificationDiagnosisPlan">修改</Button>
        <Button type="primary" icon="el-icon-remove-outline" @click="deleteDiagnosisPlan">删除</Button>
        <Button type="primary" icon="el-icon-refresh" @click="getDiagnosisList(1)">刷新</Button>
        <Button type="primary" icon="el-icon-upload" :disabled="enableDisabled" v-if="enable === 'enable'" @click="stopDiagnosisPlan('disable')">停止</Button>
        <Button type="primary" icon="el-icon-upload" :disabled="enableDisabled" v-if="enable !== 'enable'" @click="stopDiagnosisPlan('enable')">开始</Button>
        <div class="search" @keyup.enter="getDiagnosisList">
          <Input placeholder="请输入计划名称" v-model="seek" style="width: 240px;margin-left:12px" size="mini">
          <Button type="primary" @click="getDiagnosisList" slot="append" style="color:#fff">搜索</Button>
          </Input>
        </div>
      </div>
      <div class="table" ref="table">
        <Table :height="tableHeight" @selection-change="tabSelectionChange" :data="tableDataList" style="width: 100%" highlight-current-row>
          <TableColumn type="selection" width="55"></TableColumn>
          <TableColumn type="index" label="序号" align="center"></TableColumn>
          <TableColumn prop="name" label="计划名称" align="center"></TableColumn>
          <TableColumn prop="inFilming" label="计划模板" align="center">
            <template slot-scope="scope">{{AccessTemplate(scope.row.res1.split('-')[0])}}</template>
          </TableColumn>
          <TableColumn prop="recordedLength" label="诊断总数" align="center">
            <template slot-scope="scope">{{scope.row.count}}</template>
          </TableColumn>
          <TableColumn label="执行状态" align="center">
            <template slot-scope="scope">{{scope.row.enable === 'enable' ? '正在执行' : '已停止'}}</template>
          </TableColumn>
          <TableColumn label="已执行次数" align="center">
            <template slot-scope="scope">{{scope.row.states.freq}}</template>
          </TableColumn>
          <TableColumn prop="analysis" label="执行进度" align="center">
            <template slot-scope="scope">
              <div class="progress">
                <Progress :percentage="Number(scope.row.states.percent ? scope.row.states.percent : 0)" :text-inside="true" :stroke-width="12"></Progress>
              </div>
            </template>
          </TableColumn>
          <TableColumn prop="diagnosisList" label="诊断项目" align="center" width="600px"></TableColumn>
        </Table>
      </div>
      <div class="paging">
        <div class="paging-content">
          <Pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :page-sizes="[25, 50, 100, 200]" :page-size="limit" layout="total, sizes, prev, pager, next, jumper" :total="total" background>
          </Pagination>
        </div>
      </div>
    </div>
    <PlanDialog :treeData="treeData" ref="plandialog" :planTemplates="planTemplates" :odificationBack="odificationBack" :selectTreeL="selectTreeL" :titleDiagnosis="titleDiagnosis" :showDialog='showDialog' @cancel='cancel' @submitDialog="submitDialog"></PlanDialog>
  </div>
</template>
<script>
import { getDiagnosisOfPlan, deleteDiagnosisOfPlan, putDiagnosisOfPlan, postDiagnosisOfPlan, putTaskLens, getTaskLens, deleteTaskLens, getAssingedTree, getDiagnosisOfPlanList } from '../../../http/diagConf/plan.js'
import { getServerList } from '../../../http/diagnoseServer.api'
import PlanDialog from './Plan/PlanDialog.vue'
import { rtspUrl } from './rtspUrl'
import { mapState, mapActions } from 'vuex'
export default {
  components: {
    PlanDialog
  },
  data() {
    return {
      limit: 25,
      page: 1,
      enable: '', // 启用 || 禁用
      enableDisabled: true,
      treeData: {},
      selectTreeL: [],
      odificationBack: {},
      titleDiagnosis: '添加诊断计划',
      selectionChange: [],
      tableHeight: '500px',
      seek: '',
      tableDataList: [],
      total: 0,
      showDialog: false,
      addDiagnosisStatus: false,
      diagnosisItem: {
        md: '移动帧测',
        sc: '场景切换',
        ac: '清晰度异常',
        pc: '偏色检测',
        vc: '画面遮挡',
        ab: '亮度异常',
        sm: '信号缺失',
        pf: '画面冻结',
        nd: '噪声检测',
        ptz: '云台失控'
      }
    }
  },
  created() {
    this.getDiagnosisList()
    this.getTimeEmplate()
  },
  computed: {
    ...mapState({
      planTemplates: (state) => state.planTemplates,
      terraceIp: (state) => state.terraceIp // 校园平台ip 诊断流地址使用
    })
  },
  mounted() {
    this.$nextTick(function() {
      this.tableHeight = this.$refs['table'].offsetHeight + 'px'
    })
  },
  watch: {
    seek(val) {
      if (val === '') {
        this.getDiagnosisList()
      }
    }
  },
  methods: {
    ...mapActions(['getTimeEmplate']),
    // 获取模板
    AccessTemplate(id) {
      for (let index = 0; index < this.planTemplates.length; index++) {
        if (this.planTemplates[index]._id === id) {
          return this.planTemplates[index].name
        } else {
          if (index === this.planTemplates.length) {
            return ''
          }
        }
      }
    },
    // 添加和修改  弹窗所需数据  获取机构树数据 和获取时间模板
    getPopoutData(val) {
      let taskname
      if (val === 1) {
        taskname = this.selectionChange[0].name
      } else {
        taskname = ''
      }
      return Promise.all([getAssingedTree(taskname)]).then(res => {
        this.treeData = res[0].data
      }).catch(() => {
        this.$notify.error({ message: '诊断计划详情获取失败!' })
      })
    },
    // 停止诊断计划
    stopDiagnosisPlan(val) {
      if (this.selectionChange.length !== 1) {
        this.$notify.warning({ message: '请选择一条计划!' })
        return
      }
      getDiagnosisOfPlan(this.selectionChange[0].name).then(res => {
        let data = JSON.parse(JSON.stringify(res.data.task[0]))
        data.enable = val
        postDiagnosisOfPlan({ data }, this.selectionChange[0].name).then(res => {
          if (val === 'enable') {
            this.$notify.success({ message: '开启诊断计划成功!' })
          } else {
            this.$notify.success({ message: '停止诊断计划成功!' })
          }
          this.getDiagnosisList()
        }).catch(() => {
          if (val === 'enable') {
            this.$notify.success({ message: '开启诊断计划失败!' })
          } else {
            this.$notify.success({ message: '停止诊断计划失败!' })
          }
        })
      }).catch(() => {
        this.$notify.error({ message: '诊断计划操作失败!' })
      })
    },
    // 修改诊断计划
    modificationDiagnosisPlan() {
      if (this.selectionChange.length !== 1) {
        this.$notify.warning({ message: '请选择一条计划!' })
        return
      }
      Promise.all([getDiagnosisOfPlan(this.selectionChange[0].name), getTaskLens(this.selectionChange[0].name)]).then(res => {
        this.getPopoutData(1).then(() => {
          this.odificationBack = JSON.parse(JSON.stringify(res[0].data.task[0]))
          this.odificationBack.count = res[1].data.total || 0
          this.titleDiagnosis = '修改诊断计划'
          // 获取配置过的镜头
          this.selectTreeL = JSON.parse(JSON.stringify(res[1].data.camera)) || []
          this.showDialog = true
        })
      })
    },
    // 添加诊断计划 || 修改诊断计划
    submitDialog(val) { // 由诊断配置计划中的 添加/修改 弹窗的 确定 按钮触发
      let para = []
      let camera = []
      for (const key in this.diagnosisItem) {
        if (val.ruleForm.type.includes(key)) {
          para.push({ name: key, sens: 3, enable: 'enable' })
        } else {
          para.push({ name: key, sens: 3, enable: 'disable' })
        }
      }
      // val.ruleForm.type.forEach(item => {
      //   para.push({ name: item, sens: 3, enable: 'enable' })
      // })
      val.selectedNodes.forEach(item => {
        if (!item.isOrg) {
          camera.push(JSON.parse(JSON.stringify(item)))
        }
      })
      if (camera.length < 1) {
        this.$notify.warning({ message: '请至少选择一个镜头!' })
        this.$refs.plandialog.subDiagnosisStatus = false
        return
      }
      // 生成定时任务执行计划
      let schedule = []
      for (let index = 0; index < this.planTemplates.length; index++) {
        if (this.planTemplates[index]._id === val.ruleForm.region) {
          for (let i = 0; i < this.planTemplates[index].elements.length - 1; i++) {
            let templates = this.planTemplates[index].elements[i].timeList
            if (templates.length === 0) {
              schedule.push({ index: this.planTemplates[index].elements[i].week - 1, start: '00:00:00', end: '00:00:00' })
            } else {
              schedule.push({ index: this.planTemplates[index].elements[i].week - 1, start: this.jointTime(templates[0].beginTime), end: this.jointTime(templates[templates.length - 1].endTime) })
            }
          }
        }
      }
      if (this.titleDiagnosis === '修改诊断计划') { // 修改
        // 找出那些是删除的  那些是新增的
        let deleteList = []
        let putList = []
        let deleteRequst = []
        let putRequst = []
        let equabilityList = {}
        // 未作变动的镜头 _id
        this.selectTreeL.forEach(item => {
          for (const iterator of camera) {
            if (item.res1.split('-')[0] === iterator._id) {
              equabilityList[iterator._id] = iterator._id
              break
            }
          }
        })
        // 找出被删除的镜头
        this.selectTreeL.forEach(val => {
          if (!equabilityList[val.res1.split('-')[0]]) {
            deleteList.push(JSON.parse(JSON.stringify(val)))
          }
        })
        // 找出新添加的镜头
        camera.forEach(item => {
          if (!equabilityList[item._id]) {
            putList.push(JSON.parse(JSON.stringify(item)))
          }
        })
        deleteList.forEach(val => {
          deleteRequst.push({ url: val.url })
        })
        putList.forEach(item => {
          if (item.eid) {
            putRequst.push({ 'url': rtspUrl(item, this.terraceIp), 'enable': 'enable', res1: `${item._id}-${item.chan}` })
          }
        })
        let data = { name: val.ruleForm.name, type: 'time', enable: 'enable', schedule, para, res1: `${val.ruleForm.region}-${Object.keys(equabilityList).length + putList.length}` }
        postDiagnosisOfPlan({ data }, this.odificationBack.name).then(res => {
          Promise.all([deleteTaskLens({ data: deleteRequst }, val.ruleForm.name), putTaskLens({ data: putRequst }, val.ruleForm.name)]).then(res => {
            this.showDialog = false
            this.$refs.plandialog.isFullscreen = false
            this.getDiagnosisList()
            this.$refs.plandialog.subDiagnosisStatus = false
            if (res[0].data.res === 'OK' && res[1].data.res === 'OK') {
              this.$notify.success({ message: '修改诊断计划成功!' })
            } else {
              this.$notify.error({ message: '诊断计划修改失败!' })
            }
            console.log(res)
            this.$refs.plandialog.resetFields()
          }).catch(err => {
            console.log(err)
            this.$refs.plandialog.subDiagnosisStatus = false
            this.$notify.error({ message: '诊断计划修改失败!' })
            this.$refs.plandialog.resetFields()
          })
        }).catch(err => {
          console.log(err)
          this.$notify.error({ message: '诊断计划修改失败!' })
          this.$refs.plandialog.resetFields()
        })
      } else { // 添加
        let putCamera = []
        camera.forEach(item => {
          if (item.eid) {
            putCamera.push({ 'url': rtspUrl(item, this.terraceIp), 'enable': 'enable', res1: `${item._id}-${item.chan}` })
          }
        })
        console.log(JSON.stringify(putCamera))
        let addAsync = async() => {
          await putDiagnosisOfPlan({ data: { name: val.ruleForm.name, type: 'time', enable: 'enable', schedule, para, res1: `${val.ruleForm.region}-${putCamera.length}` } })
          let putRes = await putTaskLens({ data: putCamera }, val.ruleForm.name)
          if (putRes.data.res === 'OK') {
            this.$notify.success({ message: '添加诊断计划成功!' })
          } else {
            await deleteDiagnosisOfPlan(val.ruleForm.name)
            this.$notify.error({ message: '任务镜头配置失败!' })
          }
          this.showDialog = false
          this.$refs.plandialog.isFullscreen = false
          this.$refs.plandialog.subDiagnosisStatus = false
          this.$refs.plandialog.resetFields()
          this.getDiagnosisList()
        }
        addAsync()
      }
    },
    // 删除诊断计划
    deleteDiagnosisPlan() {
      if (this.selectionChange.length < 1) {
        this.$notify.warning({ message: '请至少选择一条计划!' })
        return
      }
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        let deleteList = []
        this.selectionChange.forEach(item => {
          deleteList.push(deleteDiagnosisOfPlan(item.name))
        })
        Promise.all(deleteList).then(res => {
          let isSucceed = true
          for (let index = 0; index < res.length; index++) {
            if (res[index].data.res !== 'OK') {
              this.$notify.error({ message: '删除失败!' })
              isSucceed = false
              break
            }
          }
          if (isSucceed) {
            this.$notify.success({ message: '删除成功!' })
          }
          this.getDiagnosisList()
        }).catch(err => {
          console.log(err)
          this.$notify.error({ message: '删除失败!' })
        })
      }).catch(() => {
      })
    },
    tabSelectionChange(val) {
      this.selectionChange = val
      if (val.length === 1) {
        this.enableDisabled = false
        this.enable = val[0].enable
      } else {
        this.enableDisabled = true
      }
    },
    resize() {
      this.tableHeight = this.$refs['table'].offsetHeight + 'px'
    },
    handleSizeChange(val) {
      this.limit = val
      this.getDiagnosisList()
    },
    handleCurrentChange(val) {
      this.page = val
      this.getDiagnosisList()
    },
    addDiagnosisPlan() {
      this.addDiagnosisStatus = true
      this.$refs.plandialog.equipmentNumber = 0
      Promise.all([this.getPopoutData(), getServerList()]).then(res => {
        if (res[1].data.length <= 0) {
          this.$notify.warning({ message: '先添加诊断服务器!' })
          this.addDiagnosisStatus = false
          return
        }
        this.titleDiagnosis = '添加诊断计划'
        this.selectTreeL = []
        this.showDialog = true
        this.addDiagnosisStatus = false
      }).catch(err => {
        this.addDiagnosisStatus = false
        this.$notify.warning({ message: '数据获取失败!' })
        console.log(err)
      })
    },
    cancel(val) {
      this.showDialog = val
      this.titleDiagnosis = '添加诊断计划'
    },
    // 获取诊断计划
    getDiagnosisList(val) {
      let obj = {
        page: this.page,
        limit: this.limit,
        seek: this.seek
      }
      getDiagnosisOfPlanList(obj).then(res => {
        this.total = Number(res.headers['x-bsc-count'])
        res.data.forEach(list => {
          let diagnosisList = []
          list.para.forEach(v => {
            if (v.enable === 'enable') {
              diagnosisList.push(this.diagnosisItem[v.name])
            }
          })
          list.diagnosisList = diagnosisList.join(' ')
        })
        this.tableDataList = res.data
        if (val === 1) {
          this.$notify.success({ message: '刷新诊断计划成功!' })
        }
      }).catch(err => {
        console.log(err)
        this.$notify.error({ message: '诊断计划获取失败!' })
      })
    },
    // 时间串拼接
    jointTime(val) {
      let h = parseInt(val / 3600) < 10 ? `0${parseInt(val / 3600)}` : parseInt(val / 3600)
      let m = parseInt(val % 3600 / 60) < 10 ? `0${parseInt(val % 3600 / 60)}` : parseInt(val % 3600 / 60)
      let s = parseInt(val % 3600 % 60) < 10 ? `0${parseInt(val % 3600 % 60)}` : parseInt(val % 3600 % 60)
      return `${h}:${m}:${s}`
    }
  }
}
</script>
<style lang="less">
@import '../../../assets/theme/common';
.el-progress-bar__inner {
  background: @progress-background;
}
</style>
<style lang="less" scoped>
@import '../../../assets/theme/common';
.diagnosis-configuration {
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
      background-color: @operation_left_background;
      padding: 12px 36px 12px 24px;
      overflow: hidden;
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
      background: @operation_background_footer;
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
<style lang="less">
  @import '../../../assets/theme/common';

  .el-dialog {
    border-radius: 8px 8px 0 0;
    background-color: @table-body-gb-color;

    .el-dialog__header {
      color: @table-header-text-color;
    }

    .dialog-footer .el-button {
      color: @operation_btn_color;
      background: @btn_background_primary;

      &:hover {
        background: @ghost-hover-btn-gb-color;
      }
    }
  }

  .el-popper {
    .popper__arrow::after {
      border-bottom-color: @select-item-focus !important;
    }
  }
</style>

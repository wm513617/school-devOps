<template>
    <div class="global content content-style">
        <div class="content">
          <span class="threshold">视频诊断阈值配置</span>
            <div class="content-son">
              <div class="content-one">
                <div class="progress">
                    <Checkbox v-model="md.status"></Checkbox>
                    <span>移动帧测</span>
                    <div class="progress-son">
                        <Progress class="inner" :percentage="Number(md.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="md.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="sc.status"></Checkbox>
                    <span>场景切换</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(sc.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="sc.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="ac.status"></Checkbox>
                    <span>清晰度异常</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(ac.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="ac.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="pc.status"></Checkbox>
                    <span>偏色</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(pc.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="pc.val" style="width: 50px"></Input>
                </div>
            </div>
            <div class="content-two">
                <div class="progress">
                    <Checkbox v-model="vc.status"></Checkbox>
                    <span>画面遮挡</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(vc.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="vc.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="ab.status"></Checkbox>
                    <span>亮度异常</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(ab.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="ab.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="sm.status"></Checkbox>
                    <span>信号缺失</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(sm.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="sm.val" style="width: 50px"></Input>
                </div>
            </div>
            <div class="content-three">
                <div class="progress">
                    <Checkbox v-model="pf.status"></Checkbox>
                    <span>画面冻结</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(pf.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="pf.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="nd.status"></Checkbox>
                    <span>噪声</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(nd.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="nd.val" style="width: 50px"></Input>
                </div>
                <div class="progress">
                    <Checkbox v-model="ptz.status"></Checkbox>
                    <span>云台失控</span>
                    <div class="progress-son">
                        <Progress :percentage="Number(ptz.val)" :show-text="false" :stroke-width="strokeWidth"></Progress>
                    </div>
                        <Input v-model="ptz.val" style="width: 50px"></Input>
                </div>
            </div>
          </div>
          <div class="ops-configuration">
            <span class="title">运维报警参数</span>
            <div class="ops-config">
              <div class="video-lose">
                <span>录像丢失时长:</span>
                <div><Input v-model="videoLose" placeholder="请输入内容"></Input></div>
                <span class="right">秒    (5 - 3600)</span>
              </div>
              <div class="openRemind">
                 <Checkbox v-model="openRemind"></Checkbox>
                 <span>开启提醒</span>
              </div>
              <div class="remindInterval">
                <span>提醒间隔:</span>
                <div><Input v-model="remindInterval" placeholder="请输入内容"></Input></div>
                <span class="right">小时    (1 - 1000)</span>
              </div>
            </div>
          </div>
          <div class="button-save">
            <Button icon="el-icon-edit" @click="restoreDefault">恢复默认</Button>
            <Button icon="el-icon-setting" @click="save">保存</Button>
         </div>
        </div>
    </div>
</template>
<script>
import { getGlobalParameterConfiguration, setGlobalParameterConfiguration, getAlarmconfig, setAlarmconfig } from '../../../http/diagConf/global.js'
export default {
  data() {
    return {
      md: { status: true, val: 50 },
      sc: { status: true, val: 50 },
      ac: { status: true, val: 50 },
      pc: { status: true, val: 50 },
      vc: { status: true, val: 50 },
      ab: { status: true, val: 50 },
      sm: { status: true, val: 50 },
      pf: { status: true, val: 50 },
      nd: { status: true, val: 50 },
      ptz: { status: true, val: 50 },
      strokeWidth: 12,
      names: ['md', 'sc', 'ac', 'vc', 'ab', 'sm', 'pf', 'nd', 'pc', 'ptz'],
      checked: false,
      videoLose: 5,
      openRemind: false,
      remindInterval: 12
    }
  },
  created() {
    this.getData()
  },
  methods: {
    restoreDefault() {
      let obj = {
        data: {
          'threshold': [
            // { 'name': 'md', 'val': 50, 'enable': 'enable' },
            // { 'name': 'sc', 'val': 50, 'enable': 'enable' },
            { 'name': 'ac', 'val': 50, 'enable': 'enable' },
            { 'name': 'vc', 'val': 50, 'enable': 'enable' },
            { 'name': 'ab', 'val': 50, 'enable': 'enable' },
            { 'name': 'sm', 'val': 50, 'enable': 'enable' },
            { 'name': 'pf', 'val': 50, 'enable': 'enable' },
            { 'name': 'nd', 'val': 50, 'enable': 'enable' },
            { 'name': 'pc', 'val': 50, 'enable': 'enable' }
            // { 'name': 'ptz', 'val': 50, 'enable': 'enable' }
          ]
        }
      }
      let alam = {
        videoLose: 5,
        openRemind: 0,
        remindInterval: 12
      }
      Promise.all([setGlobalParameterConfiguration(obj), setAlarmconfig(alam)]).then(res => {
        this.$notify.success({ message: '恢复默认成功!' })
        this.getData()
      }).catch(err => {
        this.$notify.error({ message: '恢复默认失败!' })
        console.log(err)
      })
    },
    getData() {
      Promise.all([getGlobalParameterConfiguration(), getAlarmconfig()]).then(res => {
        if (res[0].data.res === 'OK') {
          this.names.forEach(val => {
            // let isChange = false
            // for (let index = 0; index < res.data.threshold.length; index++) {
            //   if (res.data.threshold[index].name === val) {
            //     isChange = true
            //     this[val].status = true
            //     this[val].val = res.data.threshold[index].val
            //     break
            //   }
            // }
            // if (!isChange) {
            //   this[val].status = false
            //   this[val].val = 50
            // }
            for (let index = 0; index < res[0].data.threshold.length; index++) {
              if (res[0].data.threshold[index].name === val) {
                this[val].status = res[0].data.threshold[index].enable === 'enable'
                this[val].val = res[0].data.threshold[index].val
                break
              }
            }
          })
        } else {
          this.$notify.error({ message: '获取配置失败!' })
        }
        this.videoLose = res[1].data.length ? res[1].data[0].videoLose : 5
        this.openRemind = res[1].data.length ? res[1].data[0].openRemind === Number(1) : false
        this.remindInterval = res[1].data.length ? res[1].data[0].remindInterval : 12
      }).catch(err => {
        this.$notify.error({ message: '获取配置失败!' })
        console.log(err)
      })
    },
    save() {
      if (!this.names.every(item => { return /^(\d|[1-9]\d|100)$/.test(this[item].val) })) {
        this.$notify.error({ message: '  请输入0-100的数字!' })
        return
      }
      if (!this.alamConfigver()) { return }
      let threshold = []
      this.names.forEach(val => {
        // if (this[val].status) {
        threshold.push({ 'name': val, 'val': Number(this[val].val), 'enable': this[val].status ? 'enable' : 'disable' })
        // }
      })
      let alam = {
        videoLose: this.videoLose,
        openRemind: this.openRemind ? 1 : 0,
        remindInterval: this.remindInterval
      }
      let global = {
        data: {
          threshold
        }
      }
      Promise.all([setGlobalParameterConfiguration(global), setAlarmconfig(alam)]).then(res => {
        this.$notify.success({ message: '保存成功!' })
        this.getData()
      }).catch(() => {
        this.$notify.error({ message: '保存失败!' })
      })
    },
    verification(newval, val, name) {
      if (!/^(\d|[1-9]\d|100)$/.test(newval) && newval !== '') {
        setTimeout(() => {
          this[name].val = val
        }, 1)
      }
    },
    alamConfigver() {
      if (/^\d+$/.test(this.videoLose) && /^\d+$/.test(this.remindInterval)) {
        if (this.videoLose >= 5 && this.videoLose <= 3600 && this.remindInterval >= 1 && this.remindInterval <= 1000) {
          return true
        }
        this.$notify.error({ message: '请输入正确的运维报警参数!' })
        return false
      } else {
        this.$notify.error({ message: '请输入正确的运维报警参数!' })
        return false
      }
    }
  },
  watch: {
    'md.val': {
      handler(newval, val) {
        this.verification(newval, val, 'md')
      },
      deep: true
    },
    'sc.val': {
      handler(newval, val) {
        this.verification(newval, val, 'sc')
      },
      deep: true
    },
    'ac.val': {
      handler(newval, val) {
        this.verification(newval, val, 'ac')
      },
      deep: true
    },
    'vc.val': {
      handler(newval, val) {
        this.verification(newval, val, 'vc')
      },
      deep: true
    },
    'ab.val': {
      handler(newval, val) {
        this.verification(newval, val, 'ab')
      },
      deep: true
    },
    'sm.val': {
      handler(newval, val) {
        this.verification(newval, val, 'sm')
      },
      deep: true
    },
    'pf.val': {
      handler(newval, val) {
        this.verification(newval, val, 'pf')
      },
      deep: true
    },
    'nd.val': {
      handler(newval, val) {
        this.verification(newval, val, 'nd')
      },
      deep: true
    },
    'pc.val': {
      handler(newval, val) {
        this.verification(newval, val, 'pc')
      },
      deep: true
    },
    'ptz.val': {
      handler(newval, val) {
        this.verification(newval, val, 'ptz')
      },
      deep: true
    }
  }
}
</script>
<style lang="less">
@import '../../../assets/theme/common';
.global {
    .el-input__inner {
        padding: 0px 10px;
    }
    .el-progress-bar__inner {
      background: @progress-background;
    }
}
</style>
<style lang="less" scoped>
@import '../../../assets/theme/common';
.global {
    font-size: 12px;

    .content {
        min-height: 670px;
        background: @main-color;
        width: 100%;
        height: 100%;
        padding: 24px;
        display: block;
        .threshold {
          display: block;
          font-size: 16px;
          color: @main-body-text-color;
          font-weight:800;
          // margin-bottom: 8px;
          padding: 8px 0;
          padding-left: 10px;
          background: @table-body-gb-color;
        }
        .ops-configuration {
          width: 100%;
          background: @table-body-gb-color;
          padding: 10px;
          padding-bottom: 120px;
          .title {
            display: block;
            font-size: 16px;
            color: @main-body-text-color;
            font-weight:800;
            margin-bottom: 8px;
          }
          .ops-config {
            width: 100%;
            .remindInterval {
              // margin: 4px 0;
              div {
                width: 180px;
                margin-left: 20px;
                display: inline-block;
              }
              .right {
                  margin-left: 24px;
                }
            }
            .video-lose {
              // margin: 16px 0;
              div {
                width: 180px;
                margin-left: 8px;
                display: inline-block;
              }
              .right {
                  margin-left: 16px;
                }
            }
            .openRemind {
              margin: 16px 0;
              // margin: 4px 0;
              span {
                margin-left: 8px;
              }
            }
          }
        }
        .content-son {
            width: 100%;
            display: flex;
            height: 280px;
            background: @table-body-gb-color;
            border-bottom: 10px solid @main-color;
        }
        .content-two {
            margin: 0 12px;
        }
        .content-one, .content-two, .content-three {
            flex: 1;
            .progress {
                display:flex;
                justify-content:center;
                align-items:center;
                display: flex;
                overflow: hidden;
                margin-bottom: 12px;
                padding: 0 12px;
                span {
                    margin-left: 8px;
                    line-height: 32px;
                    width: 60px;
                }
                .progress-son {
                    flex: 1;
                    padding-top: 2px;
                    margin-right: 12px;
                    margin: -5px 12px 0 12px;
                }
                .el-input__inner {
                    padding: 0px 10px;
                }
            }
        }
        .button-save {
            float: right;
            margin-right: 20px;
            margin-top: -50px;
            .el-button {
              color: @operation_btn_background;
              background: @btn_background_primary;

              &:hover {
                background: @primary-btn-hover-bg-color;
              }
            }
        }
    }
}
</style>

<template>
  <div class='videoPlgin'>
    <a :href="pluginDownloadUrl" target="_blank" download v-if="showDownload">{{showTips}}</a>
    <object type="application/x-webplayercontrol" ref="plugin" v-else></object>
  </div>
</template>

<script>
import { getPreviewInfo } from '@/http/videoDiagnosis.api'
const version = '1.0.0.43'
export default {
  name: 'videoPlgin',
  props: {
    param: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      plugin: null,
      isplay: false,
      pluginDownloadUrl: `${window.location.protocol}//${window.location.host}/plugin/BlueSkyWebPlayerSetup.exe`,
      showDownload: false,
      showTips: ''
    }
  },
  methods: {
    pluginClickEvent(index, status) {
      if (status === 1) {
        this.$emit('click')
      } else {
        this.$emit('dblclick')
      }
    },
    pluginEscCall(index, type, keyCode) {
      if (this.pluginState.isFullScreen && +keyCode === 27) {
        this.$emit('downEsc')
      }
    },
    openStream(param) {
      return getPreviewInfo(param)
    },
    // 根据 localStorage 的 isProxy 判断 给北京接口参数 北京需要知道使用局域网还是外网
    isProxyFormatting(obj) {
      let isProxy = JSON.parse(window.sessionStorage.getItem('isProxy'))
      if (isProxy) {
        obj.Internet = 'WAN'
      } else {
        obj.Internet = 'LAN'
      }
      return obj
    },
    async play(param = this.param) {
      if (!this.plugin) { return }
      param = this.isProxyFormatting(param)
      const suc = await this.openStream(param)
      let pluginParam = {
        streamType: param.streamType || 'main',
        devIp: param.ip,
        channel: param.channel,
        devPort: param.port + ''
      }
      pluginParam = JSON.stringify(pluginParam)
      const state = this.plugin.OpenRealStreamEx(
        JSON.stringify({
          port: suc.data.tsPort + '',
          ip: suc.data.tsIp,
          cmdStr: pluginParam
        })
      )
      console.log(state)
      if (state) {
        this.$notify.error({
          message: '视频开流失败！'
        })
        // return '开流失败'
      } else {
        return '开流成功'
      }
    },
    stop() {
      if (this.plugin && this.isplay) {
        this.plugin.CloseRealStream()
      }
    },
    videoPage(plugin) {
      if (!plugin.valid) {
        this.showDownload = true
        this.showTips = '未安装插件，点击下载'
      } else if (version !== plugin.version) {
        const arr1 = version.split('.')
        const arr2 = plugin.version.split('.')
        let hasNew = false
        if (arr2.length >= arr1.length) {
          arr2.forEach((i, index) => {
            const v = arr1[index] || 0
            if (Number(i) < Number(v)) {
              hasNew = true
            }
          })
        } else {
          arr1.forEach((i, index) => {
            const v = arr2[index] || 0
            if (Number(i) > Number(v)) {
              hasNew = true
            }
          })
        }
        // 不判断是否支持图像调节
        // if (!hasNew) {
        //   hasNew = !plugin.IsSupportPicAdjust()
        // }
        if (hasNew) {
          this.showDownload = true
          this.showTips = '插件有更新，点击下载'
        }
      }
    }
  },
  created() { },
  mounted() {
    this.$nextTick(() => {
      const plugin = this.$refs.plugin
      this.videoPage(plugin)
      if (!this.showDownload) {
        this.plugin = plugin
        setTimeout(() => {
          this.plugin.SetMouseStatusCallback(this.pluginClickEvent)
          this.plugin.SetKeyboardCallback(this.pluginEscCall)
          this.play()
        }, 100)
      }
    })
  },
  beforeDestroy() {
    if (this.isplay) {
      this.stop()
    }
  }
}
</script>

<style scoped>
.videoPlgin, object{
  width: 100%;
  height: 100%;
  text-align: center;
}
.videoPlgin a{
  color: #fff;
  display: inline-block;
  height: 100%;
  margin-top: 30%;
}
</style>

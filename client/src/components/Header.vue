<template>
  <div class="header">
    <div class="header-left">
      <div class="header-left-logo">
        <img src="../../public/image/logo/logoMenu.png" class="logo-img">
        <span class="header-title">运维管理平台</span>
      </div>
      <div class="header-left-link">
        <router-link v-for="(item, index) in router_header" :class="item[1] === theRouter ? 'nav-header' : ''" :to="item[1]" :key="index">{{item[0]}}</router-link>
      </div>
    </div>
    <div class="header-right">
      <span>{{userNaem}}</span>
      <span>{{$moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}}</span>
      <span title="全屏" v-if="!isScreen" @click="openScreen"><i class="iconfont icon-full-screen"></i></span>
      <span title="全屏" v-if="isScreen" @click="closeScreen"><i class="iconfont icon-exit-full-screen"></i></span>
    </div>
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      isScreen: false
    }
  },
  computed: {
    ...mapState({
      router_header: (state) => state.router_header,
      theRouter: (state) => state.theRouter
    }),
    userNaem() {
      return sessionStorage.getItem('username')
    }
  },
  methods: {
    openIsScreen() {
      this.isScreen = true
    },
    closeIsScreen() {
      this.isScreen = false
    },
    openScreen() {
      let elem = document.documentElement
      if (elem.requestFullscreen) {
        elem.requestFullscreen()
        this.openIsScreen()
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen()
        this.openIsScreen()
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen()
        this.openIsScreen()
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen()
        this.openIsScreen()
      }
    },
    closeScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        this.closeIsScreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
        this.closeIsScreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
        this.closeIsScreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
        this.closeIsScreen()
      }
    }
  }
}
</script>

<style lang="less">
@import "../assets/theme/common";
.header {
  height: 72px;
  min-width: 1400px;
  background-color: @app-container-bg-color;
  display: flex;
  justify-content: space-between;
}
.header .header-left {
  display: flex;
  align-items: center;
}
.header-left-logo {
  width: 460px;
  padding-left: 20px;
  display: flex;
  align-items: center;
}
.header-left-logo .logo-img {
  height: 25px;
  width: 200px;
  margin: 3px;
  text-align: center;
}
.header-title {
  padding-left: 10px;
  font-size: 16px;
  color: #fff;
}
.header-left-link {
  height: 100%;
  a {
    color: #fff;
    margin: 0 0 0 20px;
    display: inline-block;
    height: 100%;
    line-height: 72px;
    cursor: pointer;
  }
}
.header-left-link a:hover {
  color: #fda54b;
}
.header-right {
  display: flex;
  align-items: center;
  padding-right: 10px;
}
.header-right span {
  color: #ccccb5;
  margin-left: 20px;
  cursor: pointer;
  font-size: 14px;
}
.nav-header {
  color: #fda54b !important;
}
</style>

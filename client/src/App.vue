<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>
<script>
import { mapActions, mapMutations } from 'vuex'
export default {
  created() { // 创建工单需要用户名
    this.getTimeEmplate()
    this.getTerraceIp()
    let urlArr = window.location.search.replace(/\?/, '').split('&')
    window.sessionStorage.setItem('username', urlArr[0] ? urlArr[0].split('=')[1] : '')
    this.SET_INLINE(urlArr[1] ? Boolean(urlArr[1].split('=')[1]) : false)
    window.sessionStorage.setItem('isProxy', urlArr[2] ? urlArr[2].split('=')[1] : false)
  },
  methods: {
    ...mapMutations(['SET_INLINE']),
    ...mapActions(['getTimeEmplate', 'getTerraceIp'])
  }
}
</script>
<style lang="less">
  @import 'assets/css/common.less';
  @import 'assets/css/Theme.less';
  @import 'assets/fonts/iconfont.css';
</style>

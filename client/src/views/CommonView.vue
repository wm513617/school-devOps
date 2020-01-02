<template>
  <div class="common-view">
    <Header v-if="!isInline"></Header>
    <div class="router-view" :style="{'height': isInline ? '100%' : 'calc(100% - 72px)'}">
      <router-view>
      </router-view>
    </div>
  </div>
</template>
<script>
import Header from '@/components/Header'
import { mapState } from 'vuex'
export default {
  name: 'CommonView',
  computed: {
    ...mapState({
      isInline: (state) => state.isInline
    })
  },
  components: {
    Header
  }
}
</script>

<style scope>
  .common-view {
    height: 100vh;
    width: 100%;
  }
  .common-view .router-view {
    /* height: calc(100% - 72px); */
  }
</style>

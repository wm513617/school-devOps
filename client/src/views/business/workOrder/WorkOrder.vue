<template>
  <div class="work-order">
    <div class="bs-content">
      <div class="bs-left">
        <Menu default-active="AwaitingRepair" @select="handleSelect" class="left-menu">
          <MenuItem class="left-menu-item" index="AwaitingRepair">待维修工单</MenuItem>
          <MenuItem class="left-menu-item" index="FinishedRepair">已完成工单</MenuItem>
        </Menu>
      </div>
      <div class="bs-main">
        <component :is='activeComponents'></component>
      </div>
    </div>
  </div>
</template>
<script>
// import { Menu, MenuItem } from 'element-ui'
import AwaitingRepair from './AwaitingRepair'
import FinishedRepair from './FinishedRepair'
export default {
  components: {
    AwaitingRepair,
    FinishedRepair
    // Menu,
    // MenuItem
  },
  data() {
    return {
      activeComponents: 'AwaitingRepair'
    }
  },
  computed: {
  },
  methods: {
    handleSelect(key, keyPath) {
      this.activeComponents = key
    }
  }
}
</script>
<style lang='less'>
@import '../../../assets/theme/common';
  .el-menu-item.left-menu-item.is-active {
    background: @nav-bg-color;
    color: @page-text-color;
  }
  .el-menu-item:focus, .el-menu-item:hover {
    background: @table-checked-item-bg-color;
  }
</style>
<style scoped lang='less'>
@import '../../../assets/theme/common';
.work-order {
  height: 100%;
  width: 100%;
}
.work-order .el-table {
  background: @main-color!important;
}
.bs-content {
  display: flex;
  height: 100%;
  /* flex: 1; */
  padding: 16px 0;
}
.bs-left {
  width: 272px;
  margin-right: 16px;
}
.bs-main {
  display: flex;
  flex: 1;
  min-height: 865px;
}
.left-menu {
  /* display: flex; */
  height: 100%;
  background-color:@main-color;
  color:"#fff";
}
.left-menu-item {
  text-align: center;
  color:@main-body-text-color;
  border-bottom: solid 1px @operation-left-border-bottom;
}
</style>

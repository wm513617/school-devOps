<template>
  <div class="video-monitor-tree"  style="height: 100%">
    <Tabs v-model="activeName" @tab-click="handleClick"  style="height: 100%">
      <TabPane label = "按机构" name = "org" style="height: 100%">
          <div class="input">
            <Input v-model="searchVal" placeholder="请输入..." suffix-icon="el-icon-search" size="small" style="width:90%">
              <!-- <Button slot="append" class="el-icon-search"></Button> -->
            </Input>
          </div>
          <div class="tree-wrap" style="height: calc(100% - 32px);overflow: auto;">
            <TreeSearch @node-click="submitForm" :treeData="treeData" :searchVal="searchVal">
              <template slot-scope="{ node }">
                {{ node.name }}
              </template>
            </TreeSearch>
          </div>
      </TabPane>
      <TabPane label = "按设备" name = "device">
        <div class="input">
          <Input v-model="searchVal" placeholder="请输入..." suffix-icon="el-icon-search" size="small" style="width:90%">
            <!-- <Button slot="append" class="el-icon-search"></Button> -->
          </Input>
        </div>
        <div class="tree-wrap">
          <TreeSearch @node-click="submitForm" :treeData="storageTree" :searchVal="searchVal">
            <template slot-scope="{ node }">
              <span :title="node.name">{{ node.name }}</span>
            </template>
          </TreeSearch>
        </div>
      </TabPane>
    </Tabs>
  </div>
</template>

<script>
import TreeSearch from '../../../components/BStree/TreeSearch'

export default {
  props: {
    treeData: {},
    storageTree: {}
  },
  data() {
    return {
      searchVal: '',
      orgsTreeData: '',
      options: '',
      devicesTreeData: '',
      activeId: '',
      activeName: 'org'
    }
  },
  components: {
    TreeSearch
  },
  methods: {
    submitForm(val) {
      console.log(val, 663)
      this.$emit('transmitClick', val)
    },
    handleClick(val) {
      if (val.name === 'device') {
        this.$parent.getStorageTree()
      } else {
        this.$parent.getOrgTree()
      }
    }
  }
}
</script>
<style lang="less">
@import '../../../assets/theme/common.less';
  .video-monitor-tree .el-tabs__content {
    height: ~'calc(100% - 55px)'!important;
  }
  .video-monitor-tree .el-tab-pane {
    height: 100%;
  }
  .el-tabs__item:hover, .el-tabs__item.is-active {
    color: @video-button-icon-hover-color
  }
  .el-tabs__active-bar {
    background: @tab-active-background;
  }
</style>
<style lang="less" scoped>
  .video-monitor-tree .input {
    text-align: center;
  }
</style>

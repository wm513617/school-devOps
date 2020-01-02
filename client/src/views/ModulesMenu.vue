<template>
  <div class="modules-menu">
    <div class="menu-box">
      <div class="menu-work">
        <div class="work-title">
          <div style="width:30%">
            <hr>
          </div>
          <div style="width:20%">
            <h2>运维系统模块</h2>
          </div>
          <div style="width:30%">
            <hr>
          </div>
        </div>
        <div class="work-list">
          <router-link class="list-item" v-for="(item, index) in navigationMenuBusiness" :key="index" :to="item.router">
            <div>
              <div class="item-picture" v-html="item.icon"></div>
              <!-- <i class="icon iconfont">&#xe74e;</i> -->
              <span>{{item.name}}</span>
            </div>
          </router-link>
        </div>
      </div>
      <div class="menu-manage">
        <div class="manage-title">
          <div style="width:30%">
            <hr>
          </div>
          <div style="width:20%">
            <h2>系统配置模块</h2>
          </div>
          <div style="width:30%">
            <hr>
          </div>
        </div>
        <div class="manage-list">
          <router-link class="list-item" v-for="(item, index) in navigationMenuConfiguration" :key="index" :to="item.router">
            <div>
              <div class="item-picture" v-html="item.icon"></div>
              <span>{{item.name}}</span>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { navigationMenuBusiness, navigationMenuConfiguration } from '../router/routers.js'
export default {
  data() {
    return {
      navigationMenuBusiness: navigationMenuBusiness,
      navigationMenuConfiguration: navigationMenuConfiguration
    }
  }
}
</script>

<style lang="less">
@import "../assets/theme/common";
.modules-menu {
  height: 100%;
  width: 100%;
  min-height: 700px;
  background-size: 100% 100%;
  background-image: url(@operation_img);
  background: @operation_ModulesMenu_main;
  display: flex;
  justify-content: center;
}
.menu-box {
  width: 70%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.menu-work {
  margin-bottom: 60px;
}
.menu-work,
.menu-manage {
  height: 40%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: @operation_ModulesMenu_item;
}
.work-title,
.manage-title {
  width: 70%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.work-title hr,
.manage-title hr {
  height: 2px;
  border: none;
  border-top: 1px solid @operation_hr_color;
  border-bottom: 1px solid @operation_hr_color;
}
.work-list,
.manage-list {
  width: 74%;
  min-width: 985px;
  margin-left: 2px;
  display: flex;
  justify-content: flex-start;
  flex-flow: wrap;
}
.list-item {
  span {
    color: @operation_font_color;
  }
  margin: 5px 30px 50px 30px;
}
.item-picture {
  width: 80px;
  height: 80px;
  background: @icon-bg-color;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  i {
    font-size: 48px;
    line-height: 80px;
    color: @operation_background_header;
    text-align: center;
  }
}
</style>

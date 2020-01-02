<template>
    <Dialog v-if="isShowDialog" @close="$emit('cancel', false)" :visible.sync="isShowDialog" :show-close="false" class="diagnosis-dialog" width="1200px">
      <div slot="title" class="title-header">
        <span>诊断详情</span>
        <span class="two-title"> - {{titleHeader}}</span>
      </div>
      <div class="modal-sum">
        <div class="modal-preview">
          <div class="modal-preview-l">
            <div class="modal-preview-l-t">
              实时视频
            </div>
            <div class="modal-preview-l-b">
              <videoPlugin ref="preview" :param="videoParam"></videoPlugin>
            </div>
          </div>
          <div class="modal-preview-r">
            <div class="modal-preview-r-t">
              诊断截图
            </div>
            <div class="modal-preview-r-b">
              <div v-if="imgPic === ''">
                <span>无诊断截图</span>
              </div>
              <img v-else ref="diagnoseImg" :src="imgPic">
            </div>
          </div>
        </div>
        <div class="modal-status">
          <div class="modal-status-t">
            <ul>
              <li v-for="(item, index) in diagnoseStatusList" v-html="item" :key="index"></li>
              <li style="width:130px">最后检测时间</li>
            </ul>
          </div>
          <div class="modal-status-b">
            <ul>
              <li v-for="(item, index) in statusArry" :key="index" class="diagnostic-status">
                <div :style="{'backgroundColor': diagnoseParam[item] !== undefined ? diagnoseParam[item] ? '#62c370' : '#c42847' : '#8A8A8A'}"></div>
              </li>
              <li style="width:130px">{{endTime ? endTime : '-'}}</li>
            </ul>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <Button @click="cancel">取 消</Button>
      </div>
    </Dialog>
</template>
<script>
import videoPlugin from '@/components/VideoPlugin.vue'
export default {
  components: {
    videoPlugin
  },
  props: {
    showDialog: {
      type: Boolean,
      default: false
    },
    titleHeader: {
      type: String,
      default: '1号楼摄像头'
    },
    imgPic: {
      type: String,
      default: ''
    },
    endTime: {
      type: String,
      default: ''
    },
    diagnoseParam: {
      type: Object
    },
    videoParam: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      isShowDialog: false,
      diagnoseStatusList: ['信号<br/>缺失', '清晰度<br/>异常', '画面<br/>遮挡', '场景<br/>切换', '亮度<br/>异常', '画面<br/>冻结', '噪声<br/>检测', '偏色<br/>检测'],
      // diagnoseStatusList: ['信号<br/>缺失', '清晰度<br/>异常', '画面<br/>遮挡', '场景<br/>切换', '亮度<br/>异常', '画面<br/>冻结', '噪声<br/>检测', '偏色<br/>检测', 'PTZ<br/>失控'],
      statusArry: ['sm', 'ac', 'vc', 'sc', 'ab', 'pf', 'nd', 'pc'] //  诊断项目对应的数据的数组下标
      // statusArry: ['sm', 'ac', 'vc', 'sc', 'ab', 'pf', 'nd', 'pc', 'ptz'] //  诊断项目对应的数据的数组下标
    }
  },
  methods: {
    // 关闭
    cancel() {
      this.$emit('cancel', false)
    }
  },
  created() {
  },
  watch: {
    showDialog() {
      this.isShowDialog = this.showDialog
    }
  }
}
</script>
<style scoped>
  .diagnosis-dialog {
    display: flex;
    flex-direction: column;
  }
  .title-header {
    display: flex;
    justify-content: flex-start;
  }
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .modal-sum {
  min-height: 500px;
  display: flex;
  flex-direction: column;
}
.modal-preview {
  flex: 1;
  display: flex;
}
.modal-status {
  height: 100px;
  display: flex;
  flex-direction: column;
}
.modal-status-t {
  flex: 1;
}
.modal-status-b {
  flex: 1;
}
.modal-preview-l {
  width: 550px;
  margin-right: 56px;
  display: flex;
  flex-direction: column;
}
.modal-preview-r {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.modal-preview-l-t,.modal-preview-r-t {
  height: 20px;
  background-color: #0f2343;
  padding-left: 8px;
  line-height: 20px;
  color: #fff;
}
.modal-preview-l-b {
  flex: 1;
}
.modal-preview-l-b .mapVideoPreview {
  padding: 0px!important;
}
.modal-preview-r-b, .modal-preview-r-b div {
  position: relative;
  width: 100%;
  height: 100%;
}
.modal-preview-r-b div span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.modal-preview-r-b img {
  width: 100%;
  height: 100%;
}
.modal-status-t ul,.modal-status-b ul {
  display: flex;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}
.modal-status-t ul li,.modal-status-b ul li {
  flex: 1;
  font-size: 12px;
}
.modal-status-t ul li:last-of-type,.modal-status-b ul li:last-of-type {
  flex: none;
  width: 120px;
  line-height: 35.2px;
  text-align: center;
}
.diagnostic-status div{
  background-color: red;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-left: 7px;
  position: relative;
  top: 50%;
  transform: translateY(-50%);
}
</style>
<style lang="less">
@import '../../../assets/theme/common';
.el-dialog {
  border-radius: 8px 8px 0 0;
  .el-dialog__header {
    .title-header {
      color: @table-header-text-color;
    }
  }
  .el-dialog__body {
    background: @table-body-gb-color;
    .modal-preview {
      .modal-preview-l-t, .modal-preview-r-t {
        color: @operation_font_color;
        background: @table-body-gb-color;
      }
    }
  }
  .el-dialog__footer {
    background: @table-body-gb-color;
    .el-button {
      background: @btn_background_primary;
      color: @table-header-text-color;
      &:hover {
        background: @ghost-hover-btn-gb-color;
      }
    }
  }
}
</style>

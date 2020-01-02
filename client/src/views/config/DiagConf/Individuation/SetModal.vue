<template>
    <div class="setModal">
      <Dialog
        title="个性化诊断参数设置"
        :visible.sync="modal"
        width="700px"
        :before-close="close">
        <div class="modal-content">
          <div class="modal-content-checkboxs">
            <p><Checkbox label="个性化参数" v-model="enabled" @change="checkAll"></Checkbox></p>
            <ul>
              <li :key="item.name" v-for="(item) in exceptionItems">
                <Checkbox v-model="item.check" :label="item.title"  @change="changeCheckbox"></Checkbox>
                <input v-model="item.val" type="number" min="0" max="100">
              </li>
            </ul>
          </div>
          <!-- <div class="modal-content-image">
            <p>场景变更参考图:</p>
            <img src="../../../../../public/image/background/bg_menu.png" alt="">
          </div> -->
        </div>
        <span slot="footer" class="dialog-footer">
          <Button style="float: left;" disabled>获取图片</Button>
          <Button @click="modal = false">取消</Button>
          <Button type="primary" @click="save">确定</Button>
        </span>
      </Dialog>
    </div>
</template>
<script>
import { exceptionItems } from '@/constant.js'
import { getIndivduateCamera, setIndivduateCamera } from '@/http/diagConf/individuation.js'
export default {
  components: {
  },
  props: {
    camera: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      modal: false,
      enabled: false,
      exceptionItems: exceptionItems
    }
  },
  watch: {
    exceptionItems: {
      handler(newval, val) {
        val.forEach((element, index) => {
          this.verification(newval, val, index)
        })
      },
      deep: true
    },
    modal(v) {
      if (v) {
        this.exceptionItems = JSON.parse(JSON.stringify(exceptionItems))
        // let url = `rtsp://${this.camera.ip}:${this.camera.port}/${this.camera._id}-${this.camera.chan}`
        getIndivduateCamera(this.camera).then(suc => {
          if (suc.data.res === 'OK' && suc.data.threshold) {
            let isEnabled = true
            let threshold = suc.data.threshold
            this.exceptionItems.map(e => {
              threshold.map(t => {
                if (t.name === e.name) {
                  e.val = t.val
                  if (t.enable === 'enable') {
                    e.check = true
                  } else {
                    e.check = false
                    isEnabled = false
                  }
                }
              })
            })
            this.enabled = isEnabled
          }
        })
      }
    }
  },
  methods: {
    checkAll() {
      this.exceptionItems = this.exceptionItems.map(item => {
        item.check = this.enabled
        return item
      })
    },
    changeCheckbox() {
      let isEnabled = true
      for (const iterator of this.exceptionItems) {
        if (!iterator.check) {
          this.enabled = false
          isEnabled = false
          return
        }
      }
      if (isEnabled) {
        this.enabled = true
      }
    },
    verification(newval, val, index) {
      if (!/^(\d|[1-9]\d|100)$/.test(newval[index].val) && newval[index].val !== '') {
        setTimeout(() => {
          this.exceptionItems[index].val = 50
        }, 1)
      }
    },
    changeExcepItemCheck(val, index) {
      console.log(val, index)
    },
    save() {
      // let url = `rtsp://${this.camera.ip}:${this.camera.port}/${this.camera._id}-${this.camera.chan}`
      let data = []
      this.exceptionItems.map((item, index) => {
        data.push({
          name: item.name,
          val: Number(item.val),
          enable: item.check ? 'enable' : 'disable'
        })
      })
      setIndivduateCamera(this.camera, {
        threshold: data
      }).then(suc => {
        this.$notify.success({
          message: '保存成功'
        })
        this.modal = false
      }).catch(suc => {
        this.$notify.error({
          message: '保存失败'
        })
      })
    },
    close() {
      this.modal = false
    }
  }
}
</script>
<style lang="less" scoped>
  .indivduate-actions {
    display: flex;
    justify-content: space-between;
    padding: 12px 24px;
  }
  .indivduate-page {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 40px;
    background: #244575;
    padding-right: 20px;
    .el-pagination {
      padding: 0;
      float: right;
    }
  }
  .modal-content-checkboxs ul {
    display: flex;
    flex-wrap: wrap;
  }
  .modal-content-checkboxs ul li{
    display: flex;
    justify-content: space-between;
    width: 33.33%;
    align-items: center;
    padding-right: 50px;
    margin-top: 20px;
  }
  .modal-content-image p {
    padding: 20px 0;
  }
  .modal-content-image img {
    width: 100%;
    height: 400px;
    border: 1px solid #244575;
  }
</style>

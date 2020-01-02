<template>
  <Dialog class="assets-model" title="修改信息" :width="width" :visible="showModel" :show-close="false" @close="resetForm">
    <tabs style="height: 380px;" v-model="activeName">
      <tab-pane label="基本信息" name="first">
        <Form :model="formData" :rules="formRule" ref="ruleForm1" label-width="96px" label-position="left" :inline="true" :hide-required-asterisk="true">
          <FormItem label="设备名称" prop="name">
            <Input class="form-input" v-model="formData.name" :disabled="true" />
          </FormItem>
          <FormItem label="设备类型" prop="type">
            <Select class="form-input" placeholder="请选择设备类型" v-model="formData.type" :disabled="true">
              <Option v-for="item in assetsTypeArr" :label="item.label" :value="item.value" :key="item.value"></Option>
            </Select>
          </FormItem>
          <FormItem label="所属机构" prop="orgName">
            <Input class="form-input" v-model="formData.orgName" :disabled="true" />
          </FormItem>
          <FormItem label="厂商" prop="manufacturer">
            <Input class="form-input" v-model="formData.manufacturer" :disabled="true" />
          </FormItem>
          <FormItem label="IP地址" prop="ip">
            <Input class="form-input" v-model="formData.ip" :disabled="true" />
          </FormItem>
          <FormItem label="设备型号" prop="model">
            <Input class="form-input" v-model="formData.model" :disabled="true" />
          </FormItem>
          <FormItem label="建设时间" prop="constructTime">
            <date-picker class="form-input" type="date" v-model="formData.constructTime"></date-picker>
          </FormItem>
          <FormItem label="安装位置" prop="InstallPosition">
            <Input class="form-input" v-model="formData.InstallPosition" />
          </FormItem>
          <FormItem label="经度" prop="longitude">
            <Input class="form-input" v-model="formData.longitude" />
          </FormItem>
          <FormItem label="纬度" prop="latitude">
            <Input class="form-input" v-model="formData.latitude" />
          </FormItem>
        </Form>
      </tab-pane>
      <tab-pane label="扩展信息" name="secode">
        <Form :model="formData" :rules="formRule" ref="ruleForm2" label-width="96px" label-position="left" :inline="true" :hide-required-asterisk="true">
          <FormItem label="摄像机类型" prop="monitortype">
            <Input class="form-input" v-model="formData.monitortype" :disabled="true" />
          </FormItem>
          <FormItem label="警区" prop="district">
            <Input class="form-input" v-model="formData.district" />
          </FormItem>
          <FormItem label="位置类型扩展" prop="locationExtension">
            <Select class="form-input" placeholder="请选择位置类型" v-model="formData.locationExtension">
              <Option v-for="(item, index) in locationExtensionArr" :label="item.label" :value="item.value" :key="index"></Option>
            </Select>
          </FormItem>
          <FormItem label="安装位置" prop="site">
            <Select class="form-input" placeholder="请选择安装位置" v-model="formData.site">
              <Option label="室内" :value="1"></Option>
              <Option label="室外" :value="2"></Option>
            </Select>
          </FormItem>
          <FormItem label="摄像机用途" prop="usage">
            <Select class="form-input" placeholder="请选择摄像机用途" v-model="formData.usage">
              <Option label="治安" :value="1"></Option>
              <Option label="交通" :value="2"></Option>
              <Option label="重点" :value="3"></Option>
            </Select>
          </FormItem>
          <FormItem label="摄像机补光" prop="fill">
            <Select class="form-input" placeholder="请选择补光类型" v-model="formData.fill">
              <Option label="无补光" :value="0"></Option>
              <Option label="红外补光" :value="1"></Option>
              <Option label="白光补光" :value="2"></Option>
            </Select>
          </FormItem>
          <FormItem label="监视方位" prop="monitoPosition">
            <Select class="form-input" placeholder="请选择监视方位" v-model="formData.monitoPosition">
              <Option v-for="item in position" :label="item.label" :value="item.value" :key="item.value"></Option>
            </Select>
          </FormItem>
          <FormItem label="支持国标" prop="supportGB">
            <Select class="form-input" placeholder="请选择" v-model="formData.supportGB">
              <Option label="是" :value="1"></Option>
              <Option label="否" :value="2"></Option>
            </Select>
          </FormItem>
          <FormItem label="是否可控" prop="controllable">
            <Select class="form-input" placeholder="请选择" v-model="formData.controllable">
              <Option label="可控" :value="1"></Option>
              <Option label="不可控" :value="2"></Option>
            </Select>
          </FormItem>
        </Form>
      </tab-pane>
      <tab-pane label="维保信息" name="third">
        <Form :model="formData" :rules="formRule" ref="ruleForm3" label-width="96px" label-position="left" :inline="true" :hide-required-asterisk="true">
          <FormItem label="维保厂商" prop="maintenanceVendor">
            <Select class="form-input" placeholder="请选择维保厂商" v-model="formData.maintenanceVendor" @change="changeFirm">
              <Option v-for="(item, index) in firmArr" :label="item.maintenanceVendor" :value="item.maintenanceVendor" :key="index"></Option>
            </Select>
          </FormItem>
          <FormItem label="联系人" prop="contacts">
            <Select class="form-input" placeholder="请选择联系人" v-model="formData.contacts" @change="changePeople">
              <Option v-for="(item, index) in peopleArr" :label="item.contact" :value="item.contact" :key="index"></Option>
            </Select>
          </FormItem>
          <FormItem label="联系电话" prop="phone">
            <Input class="form-input" v-model="formData.phone " :disabled="true" />
          </FormItem>
          <FormItem label="邮件地址" prop="email">
            <Input class="form-input" v-model="formData.email" :disabled="true" />
          </FormItem>
          <FormItem label="维保开始" prop="startTime">
            <date-picker class="form-input" type="date" v-model="formData.startTime"></date-picker>
          </FormItem>
          <FormItem label="维保结束" prop="endTime">
            <date-picker class="form-input" type="date" v-model="formData.endTime"></date-picker>
          </FormItem>
        </Form>
      </tab-pane>
    </tabs>
    <div slot="footer" class="dialog-footer">
      <Button @click="submitBtn">确 定</Button>
      <Button @click="$emit('cancel')">取 消</Button>
    </div>
  </Dialog>
</template>

<script>
import { validateName64, validate180, validate90 } from './validate.js'
export default {
  name: 'assetModel',
  props: {
    showModel: Boolean,
    width: {
      type: String,
      default: '800px'
    },
    tableFormData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    firmArr: Array,
    peoples: Array,
    locationExtensionArr: Array,
    assetsTypeArr: Array,
    position: Array
  },
  data() {
    return {
      formData: '',
      peopleArr: [],
      formRule: {
        InstallPosition: [{ validator: validateName64, trigger: 'change' }],
        longitude: [{ validator: validate180, trigger: 'change' }],
        latitude: [{ validator: validate90, trigger: 'change' }],
        district: [{ validator: validateName64, trigger: 'change' }],
        maintenanceVendor: [{ required: true, message: '请选择维保厂商', trigger: 'change' }],
        contacts: [{ required: true, message: '请选择联系人', trigger: 'change' }],
        startTime: [{ required: true, type: 'date', message: '请选择日期', trigger: 'change' }],
        endTime: [{ required: true, type: 'date', message: '请选择日期', trigger: 'change' }]
      },
      selectNode: [],
      activeName: 'first'
    }
  },
  watch: {
    tableFormData: {
      deep: true,
      handler: function(val) {
        this.formData = val
      }
    },
    peoples: {
      deep: true,
      handler: function(val) {
        console.log(val, 'val')
        this.peopleArr = val
      }
    },
    showModel: {
      deep: true,
      handler: function(val) {
        if (val) {
          this.activeName = 'first'
          this.peopleArr = []
        }
      }
    }
  },
  methods: {
    changeFirm() {
      this.firmArr.forEach(obj => {
        if (obj.maintenanceVendor === this.formData.maintenanceVendor) {
          this.peopleArr = obj.contacts
        }
      })
      this.formData.phone = ''
      this.formData.contacts = ''
      this.formData.email = ''
    },
    changePeople() {
      this.peopleArr.forEach(obj => {
        if (obj.contact === this.formData.contacts) {
          this.formData.phone = obj.phone
          this.formData.email = obj.email
        }
      })
    },
    resetForm() {
      this.$refs['ruleForm1'].resetFields()
      this.$refs['ruleForm2'].resetFields()
      this.$refs['ruleForm3'].resetFields()
    },
    submitBtn() {
      this.$refs['ruleForm1'].validate((v) => {
        if (v) {
          this.$refs['ruleForm2'].validate(n => {
            if (n) {
              this.$emit('confim', this.formData)
            } else {
              this.$notify.error({ message: '表单验证有误，请检查表单！' })
            }
          })
        } else {
          return this.$notify.error({
            message: '表单验证有误，请检查表单！'
          })
        }
      })
    }
  },
  mounted() {
    this.formData = this.tableFormData
    this.firmArr.forEach(item => {
      if (item.maintenanceVendor === this.formData.maintenanceVendor) {
        this.peopleArr = item.contacts
      }
    })
  }
}
</script>

<style lang="less">
@import '.../../../../../assets/theme/common.less';
.assets-model .el-form-item {
  margin-left: 18px;
}
.assets-model .el-form-item__content {
  width: 250px;
}
.el-tabs__item.is-active {
  color: @video-button-icon-hover-color;
}
.el-tabs__item:hover {
  color: @video-button-icon-hover-color;
}
.el-tabs__active-bar {
  background-color: @tab-active-background;
}
</style>
<style scoped>
.form-input {
  width: 250px;
}
</style>

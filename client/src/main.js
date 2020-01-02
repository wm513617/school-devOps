import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import echarts from 'echarts'
import moment from 'moment'
import lodash from 'lodash'

// 引入pubsub、初始化appHook
import './appHooks'

// 引入axios、设置baseURL
import './http'

// element-ui组件库按需引入
import {
  Button,
  Message,
  Checkbox,
  CheckboxGroup,
  Tooltip,
  Select,
  Option,
  Input,
  Table,
  TableColumn,
  Pagination,
  Tabs,
  TabPane,
  Tree,
  Icon,
  Dialog,
  Notification,
  Progress,
  Loading,
  Form,
  FormItem,
  InputNumber,
  MessageBox,
  DatePicker,
  Menu,
  MenuItem
} from 'element-ui'
Vue.component('Button', Button)
Vue.component('Progress', Progress)
Vue.component('Tabs', Tabs)
Vue.component('TabPane', TabPane)
Vue.component('Tree', Tree)
Vue.component('Checkbox', Checkbox)
Vue.component('CheckboxGroup', CheckboxGroup)
Vue.component('Tooltip', Tooltip)
Vue.component('Select', Select)
Vue.component('Option', Option)
Vue.component('Table', Table)
Vue.component('TableColumn', TableColumn)
Vue.component('Pagination', Pagination)
Vue.component('Input', Input)
Vue.component('InputNumber', InputNumber)
Vue.component('Icon', Icon)
Vue.component('Dialog', Dialog)
Vue.component('Message', Message)
Vue.component('Notification', Notification)
Vue.component('Loading', Loading)
Vue.component('Form', Form)
Vue.component('FormItem', FormItem)
Vue.component('DatePicker', DatePicker)
Vue.component('Menu', Menu)
Vue.component('MenuItem', MenuItem)
Vue.use(Loading.directive)
Vue.message = Vue.prototype.$message = Message
Vue.prototype.$confirm = MessageBox.confirm
Vue.prototype.$notify = Notification
// 引入moment
Vue.prototype.$moment = Vue.moment = moment

// 引入Echarts库
Vue.prototype.$echarts = Vue.echarts = echarts

Vue.config.productionTip = false
Vue.prototype.$lodash = Vue.lodash = lodash

// 自定义指令
Vue.directive('resize', {
  inserted(el, binding) {
    if (binding.value && typeof (binding.value) === 'function') {
      window.addEventListener('resize', binding.value)
    }
  },
  unbind(el, binding) {
    window.removeEventListener('resize', binding.value)
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

// 通过订阅消息进行统一的业务处理
import Vue from 'vue'
import PubSub from 'pubsub-js'
// pubsub挂载Vue
Vue.pubsub = Vue.prototype.$pubsub = PubSub

const hooks = {}

/**
 * 错误处理
 * @param { String } msg -消息主题
 * @param { Object } obj
 * @property { String } obj.type    -错误类型，待扩展
 * @property { String } obj.info     -错误内容
 */
hooks.error = (msg, { info, type }) => {
  Vue.message.error(info)
}

/**
 * 登录/认证成功
 */
hooks.authSuccess = () => {
  Vue.message.success('登录成功')
}

/**
 * 注销/断开
 */
hooks.authFail = () => {
  Vue.message.warning('注销')
}

Object.keys(hooks).forEach(key => {
  Vue.pubsub.subscribe(key, hooks[key])
})

import Vue from 'vue'

// 全局参数获取
export const getGlobalParameterConfiguration = () => {
  return Vue.http('/ops/proxy?method=get&url=/sys/para/threshold')
}
// 全局参数设置
export const setGlobalParameterConfiguration = (data) => {
  return Vue.http.post('/ops/proxy?method=post&url=/sys/para/threshold', data)
}
export const getAlarmconfig = () => {
  return Vue.http.get('/ops/alarmconfig/gain')
}
export const setAlarmconfig = (data) => {
  return Vue.http.post('/ops/alarmconfig/add', data)
}

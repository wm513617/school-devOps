import Vue from 'vue'
// 全局参数获取
export const getGlobalParameterConfiguration = () => {
  return Vue.http('/ops/proxy?method=get&url=/sys/para/threshold')
}
// 全局参数设置
export const setGlobalParameterConfiguration = (data) => {
  return Vue.http.post('/ops/proxy?method=post&url=/sys/para/threshold', data)
}
// 诊断计划获取
export const getDiagnosisOfPlan = (taskname) => {
  let name
  if (taskname) {
    name = taskname
  } else {
    name = ''
  }
  return Vue.http(`/ops/proxy?method=get&url=/vd/task?name=${name}`)
}
// 添加诊断计划
export const putDiagnosisOfPlan = (data) => {
  return Vue.http.post('/ops/proxy?method=put&url=/vd/task', data)
}
// 修改诊断计划
export const postDiagnosisOfPlan = (data, taskname) => {
  return Vue.http.post(`/ops/proxy?method=post&url=/vd/task?name=${taskname}`, data)
}
// 诊断计划状态获取
export const getDiagnosisOfStatus = (taskname) => {
  return Vue.http(`/ops/proxy?method=get&url=/task/state?name=${taskname}`)
}
// 删除诊断计划
export const deleteDiagnosisOfPlan = (taskname) => {
  return Vue.http.post(`/ops/proxy?method=DELETE&url=/vd/task?name=${taskname}`)
}
// 添加任务镜头
export const putTaskLens = (data, taskname) => {
  return Vue.http.post(`/ops/proxy?method=PUT&url=/task/camera?task=${taskname}`, data)
}
// 获取所有任务镜头
export const getTaskLens = (taskname) => {
  return Vue.http(`/ops/proxy?method=get&url=/task/camera?task=${taskname}&page=1&max=10000`)
}
// 删除任务镜头
export const deleteTaskLens = (data, taskname) => {
  return Vue.http.post(`/ops/proxy?method=DELETE&url=/task/camera?task=${taskname}`, data)
}
export const getAssingedTree = () => {
  return Vue.http('/ops/resource/assingedTree')
}

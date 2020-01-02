import Vue from 'vue'

// 诊断计划获取
export const getDiagnosisOfPlanList = (obj) => {
  return Vue.http(`/ops/planlist?page=${obj.page}&limit=${obj.limit}&seek=${obj.seek}`)
}
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
  // return Vue.http.post(`/ops/proxy?method=PUT&url=/task/camera?task=${taskname}`, data, { timeout: 0 })
  return Vue.http({
    url: `/ops/proxy?method=PUT&url=/task/camera?task=${taskname}`,
    method: 'post',
    data,
    timeout: 10 * 60 * 1000
  })
}
// 获取所有任务镜头
export const getTaskLens = (taskname) => {
  return Vue.http(`/ops/proxy?method=get&url=/task/camera?task=${taskname}&page=1&max=10000`)
}
// 删除任务镜头
export const deleteTaskLens = (data, taskname) => {
  return Vue.http.post(`/ops/proxy?method=DELETE&url=/task/camera?task=${taskname}`, data)
}
// 时间模板获取
export const getTimeEmplate = () => {
  return Vue.http('/ops/timeEmplate')
}
// 获取分配树
export const getAssingedTree = (taskname) => {
  return Vue.http(`/ops/diag/unconfTree?taskname=${taskname}`)
}
// 获取校园平台ip
export const getTerraceIp = () => {
  return Vue.http('/ops/terraceIp')
}

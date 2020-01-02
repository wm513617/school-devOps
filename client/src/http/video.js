import Vue from 'vue'

export const getVideoOrg = body => {
  return new Promise((resolve, reject) => {
    Vue.http
      .get('/ops/video/monitor/list', {
        params: body
      })
      .then(suc => {
        resolve(suc)
      })
      .catch(err => {
        reject(err)
      })
  })
}
export const getStorageList = body => { // 按储存设备获取录像定时计划的资源
  return Vue.http.get('/ops/video/storageList', {
    params: body
  })
}
// 获取存储设备机构树
export const getStorageTree = () => {
  return Vue.http.get('/ops/video/storageTree')
}
// 获取录像监测统计信息
export const getRecordInfoNum = (oid) => {
  return Vue.http.get(`/ops/video/recodestatus?oid=${oid}`)
}
// 获取录像监测按设备统计信息
export const getRecordDevInfoNum = (oid, sub) => {
  return Vue.http.get(`/ops/video/devrecodestatus?oid=${oid}&sub=${sub}`)
}
// 获取录像详情数据
export const getVideoHistoryData = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('ops/videoHistoryStatus', {
      params: {
        channel: params.channel,
        ip: params.ip,
        startTime: params.startTime,
        endTime: params.endTime,
        port: params.port
      }
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

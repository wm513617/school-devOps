import Vue from 'vue'

export const getDeviceData = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/device/list', {
      params: {
        oid: params.oid,
        seek: params.seek,
        bigtype: params.bigtype,
        page: params.page,
        limit: params.limit,
        sub: params.sub,
        status: params.status,
        onLineRate: params.onLineRate
      }
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}

export const getDevHistoryData = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('ops/devHistoryStatus', {
      params: {
        category: params.category,
        ip: params.ip,
        startTime: params.startTime,
        endTime: params.endTime,
        port: params.port,
        bigtype: params.bigtype
      }
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}
// 获取设备总数
export const getDeviceCount = oid => {
  return Vue.http.get(`/ops/device/count?oid=${oid}`)
}

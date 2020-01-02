import Vue from 'vue'

export const getVideoDiagData = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/diag/final/list', {
      params: {
        oid: params.oid,
        limit: params.limit,
        seek: params.seek,
        page: params.page,
        sub: params.sub,
        status: params.status,
        snece: params.snece
      }
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}
export const getPreviewInfo = (params) => {
  console.log('params', params)
  return new Promise((resolve, reject) => {
    Vue.http.post(`/ops/video/preview`, {
      devIp: params.ip,
      devPort: params.port,
      channel: params.channel,
      streamType: params.streamType,
      Internet: params.Internet
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}
export const getDiagFinalStatus = (data) => {
  return Vue.http('/ops/diag/final/status', data)
}

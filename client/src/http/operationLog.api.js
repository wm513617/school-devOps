import Vue from 'vue'

export const getOperationLogList = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/log/list', {
      params: params || {}
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}

export const getOperationLogDetial = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/log/particulars', {
      params: params || {}
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

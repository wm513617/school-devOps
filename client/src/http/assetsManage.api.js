import Vue from 'vue'

export const getAssetsTable = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/assets/list', {
      params: params
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}

export const getChartsList = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/assets/count', {
      params: params
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const getAssetsRowDetial = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/assets/particulars', {
      params: params
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const setAssetsRow = (type, id, params) => {
  return new Promise((resolve, reject) => {
    Vue.http.post(`/ops/assets/modification?type=${type}&id=${id}`, params).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const batSetModification = (type, params) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/assets/bulkEditing?type=' + type, params).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

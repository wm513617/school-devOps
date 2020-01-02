import Vue from 'vue'

export const getServerList = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/diagnoseServers/list', {
      params: params || {}
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}

export const addServer = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/diagnoseServers/add', params).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const updateServer = (id, params) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/diagnoseServers/modification?id=' + id, params).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const delServer = (ids) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/diagnoseServers/delete', {
      ids: ids
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

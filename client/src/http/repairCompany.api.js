import Vue from 'vue'

export const getCompanyList = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/maintenance/list', {
      params: params || {}
    }).then(suc => {
      resolve(suc)
    }).catch(err => {
      reject(err)
    })
  })
}

// export const getCompanyDetial = (id) => {
//   return new Promise((resolve, reject) => {
//     Vue.http.get('/ops/maintenance/list', {
//       params: id
//     }).then(suc => {
//       resolve(suc.data)
//     }).catch(err => {
//       reject(err)
//     })
//   })
// }

export const setCompany = (id, params) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/maintenance/modification?id=' + id, params).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const delCompany = (ids) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/maintenance/delete', {
      ids: ids
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

export const addCompany = (params) => {
  return new Promise((resolve, reject) => {
    Vue.http.post('/ops/maintenance/add', params).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

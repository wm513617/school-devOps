import Vue from 'vue'

export const getOrgTree = (type) => {
  return new Promise((resolve, reject) => {
    Vue.http.get('/ops/org/tree', {
      params: {
        type: type
      }
    }).then(suc => {
      resolve(suc.data)
    }).catch(err => {
      reject(err)
    })
  })
}

import Vue from 'vue'

export const getResAssingedTable = query => {
  return new Promise((resolve, reject) => {
    Vue.http
      .get('/ops/resource/assingedList', {
        params: query
      })
      .then(suc => {
        resolve(suc)
      })
      .catch(err => {
        reject(err)
      })
  })
}

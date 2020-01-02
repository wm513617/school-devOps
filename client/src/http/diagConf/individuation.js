import Vue from 'vue'

export const getDiagResTable = query => {
  return new Promise((resolve, reject) => {
    Vue.http
      .get('/ops/diag/list', {
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
// 获取个性化镜头参数
export const getIndivduateCamera = (camera, data) => {
  return new Promise((resolve, reject) => {
    Vue.http
      .get(`/ops/proxy?method=get&url=/task/camera/customization?url=${camera.url.url}&task=${camera.url.name}`)
      .then(suc => {
        resolve(suc)
      })
      .catch(err => {
        reject(err)
      })
  })
}
// 设置个性化镜头参数
export const setIndivduateCamera = (camera, data) => {
  return new Promise((resolve, reject) => {
    Vue.http
      .post(`/ops/proxy?method=post&url=/task/camera/customization?url=${camera.url.url}&task=${camera.url.name}`, {
        data: data
      })
      .then(suc => {
        resolve(suc)
      })
      .catch(err => {
        reject(err)
      })
  })
}

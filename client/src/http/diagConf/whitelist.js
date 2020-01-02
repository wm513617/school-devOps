import Vue from 'vue'
// 获取白名单
export const getWhiteListData = (data) => {
  return Vue.http.get('/ops/whitelist', { params: data })
}
// 添加白名单
export const addWhiteListData = (data) => {
  return Vue.http.post('/ops/proxy?method=put&url=/vd/whitelist', data)
}
// 删除白名单
export const delWhiteListData = (data) => {
  return Vue.http.post('/ops/proxy?method=delete&url=/vd/whitelist', data)
}
export const getWhiteListTree = () => {
  return Vue.http('/ops/diag/unconfTree?tasktype=whitelist')
}

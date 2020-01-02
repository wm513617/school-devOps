import Vue from 'vue'
import axios from 'axios'
Vue.prototype.$http = Vue.http = axios

// 请求延时
Vue.http.create({
  timeout: 2500
})
// response interceptor
Vue.http.interceptors.request.use(request => {
  return request
})

// request interceptor
axios.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (process.env.NODE_ENV === 'development' && error.response) {
      console.log(`${error.response.status} , ${error.response}`)
      // 针对特殊status状态处理
      // switch (error.response.status) {
      //   case 401:
      //     break
      //   case 403:
      //     break
      //   default:
      //     console.log('error')
      // }
    }
    return Promise.reject(error.response.data.error)
  }
)

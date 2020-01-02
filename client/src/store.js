import Vue from 'vue'
import Vuex from 'vuex'
import { getTimeEmplate, getTerraceIp } from './http/diagConf/plan'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    router_header: [],
    theRouter: '',
    planTemplates: [],
    terraceIp: '', // 校园平台ip
    isInline: false
  },
  mutations: {
    SET_INLINE(state, val) {
      state.isInline = val
    },
    INIT_HEADER(state, val) {
      state.router_header = val
    },
    UPDATE_THEROUTER(state, val) {
      state.theRouter = val
    },
    SET_PLAN_TEMPLATES(state, val) {
      state.planTemplates = val
    },
    SET_TERRACE_IP(state, val) {
      state.terraceIp = val
    }
  },
  actions: {
    getTimeEmplate({ commit }) {
      getTimeEmplate().then(res => {
        console.log(res)
        commit('SET_PLAN_TEMPLATES', res.data)
      }).catch(err => {
        console.log(err)
      })
    },
    getTerraceIp({ commit }) {
      getTerraceIp().then(res => {
        console.log(res)
        commit('SET_TERRACE_IP', res.data.ip)
      }).catch(err => {
        console.log(err)
      })
    }
  }
})

import Vue from 'vue'
import Router from 'vue-router'
import businessRoutes from './businessRoutes'
import configRoutes from './configRoutes'
import store from '../store'
import { routers } from './routers'

Vue.use(Router)

const ModulesMenu = resolve => require(['@/views/ModulesMenu.vue'], resolve)
const CommonView = resolve => require(['@/views/CommonView.vue'], resolve)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      component: CommonView,
      redirect: '/modules_menu',
      children: [...businessRoutes, ...configRoutes, {
        path: '/modules_menu',
        component: ModulesMenu
      }]
    }, {
      path: '/index.html',
      component: CommonView,
      redirect: '/modules_menu'
    }, {
      path: '*',
      component: {
        render(h) {
          return h('div', {
            staticClass: 'flex flex-main-center',
            attrs: {
              style: 'width:100%;font-size:32px'
            }
          }, '未找到哦')
        }
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (routers[to.fullPath.split('/')[1]] !== undefined) {
    store.commit('INIT_HEADER', routers[to.fullPath.split('/')[1]])
  }
  store.commit('UPDATE_THEROUTER', to.fullPath)
  next()
})
export default router

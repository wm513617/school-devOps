const Plan = resolve => require(['@/views/config/DiagConf/Plan.vue'], resolve)
const Global = resolve => require(['@/views/config/DiagConf/Global.vue'], resolve)
const Individuation = resolve => require(['@/views/config/DiagConf/Individuation.vue'], resolve)
const WhiteList = resolve => require(['@/views/config/DiagConf/WhiteList.vue'], resolve)
const RepairCompany = resolve => require(['@/views/config/DiagConf/repairCompany.vue'], resolve)
const DiagnoseServer = resolve => require(['@/views/config/DiagConf/diagnoseServer.vue'], resolve)

export default [
  {
    path: '/diag_conf',
    redirect: '/diag_conf/plans',
    name: 'diag_conf',
    meta: {
      title: '诊断设置',
      tag: true
    }
  },
  {
    path: '/diag_conf/plans',
    name: 'plans',
    component: Plan,
    meta: {
      title: '诊断计划配置',
      tag: true
    }
  },
  {
    path: '/diag_conf/global',
    name: 'global',
    component: Global,
    meta: {
      title: '全局参数配置',
      tag: true
    }
  },
  {
    path: '/diag_conf/individuation',
    name: 'individuation',
    component: Individuation,
    meta: {
      title: '个性化参数配置',
      tag: true
    }
  },
  {
    path: '/diag_conf/white_list',
    name: 'white_list',
    component: WhiteList,
    meta: {
      title: '白名单配置',
      tag: true
    }
  },
  {
    path: '/diag_conf/repair_company',
    name: 'repair_company',
    component: RepairCompany,
    meta: {
      title: '白名单配置',
      tag: true
    }
  },
  {
    path: '/diag_conf/diagnose_server',
    name: 'diagnose_server',
    component: DiagnoseServer,
    meta: {
      title: '白名单配置',
      tag: true
    }
  }
]

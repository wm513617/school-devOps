const DeviceMonitor = resolve => require(['@/views/business/DeviceMonitor.vue'], resolve)
const VideoMonitor = resolve => require(['@/views/business/VideoMonitor.vue'], resolve)
const VideoDiagnosis = resolve => require(['@/views/business/VideoDiagnosis.vue'], resolve)
const assetsManage = resolve => require(['@/views/business/assetsManage.vue'], resolve)
const operationLog = resolve => require(['@/views/business/operationLog.vue'], resolve)
const workOrder = resolve => require(['@/views/business/workOrder/WorkOrder.vue'], resolve)

export default [
  {
    path: '/device_monitor',
    name: 'device_monitor',
    component: DeviceMonitor,
    meta: {
      title: '设备监测',
      tag: true
    }
  },
  {
    path: '/video_monitor',
    name: 'video_monitor',
    component: VideoMonitor,
    meta: {
      title: '录像监测',
      tag: true
    }
  },
  {
    path: '/video_diagnosis',
    name: 'video_diagnosis',
    component: VideoDiagnosis,
    meta: {
      title: '视频诊断',
      tag: true
    }
  },
  // 资产管理
  {
    path: '/asset_management',
    name: 'asset_management',
    component: assetsManage,
    meta: {
      title: '资产管理',
      tag: true
    }
  },
  // 运维日志
  {
    path: '/operational_log',
    name: 'operational_log',
    component: operationLog,
    meta: {
      title: '运维日志',
      tag: true
    }
  },
  // 工单管理
  {
    path: '/workorder_management',
    name: 'workorder_management',
    component: workOrder,
    meta: {
      title: '工单管理',
      tag: true
    }
  }
]

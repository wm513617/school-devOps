const navigation = ['导航', '/modules_menu']
// 导航头部配置
export const routers = {
  'modules_menu': [],
  'operations_homepage': [navigation, ['运维首页']],
  'device_monitor': [navigation, ['设备监测', '/device_monitor']],
  'video_monitor': [navigation, ['录像监测', '/video_monitor']],
  'alarm_center': [navigation, ['报警中心', '/alarm_center'],
    ['历史报警', '/alarm_center/historical']
  ],
  'video_diagnosis': [navigation, ['视频诊断', '/video_diagnosis']],
  'operational_log': [navigation, ['运维日志', '/operational_log']],
  'asset_management': [navigation, ['资产管理', '/asset_management']],
  'lifecycle': [navigation, ['生命周期', '/lifecycle']],
  'workorder_management': [navigation, ['工单管理', '/workorder_management']],
  'statistical_analysis': [navigation, ['资产统计', '/statistical_analysis'],
    ['设备监测统计', '/statistical_analysis/device'],
    ['录像监测统计', '/statistical_analysis/video'],
    ['视频诊断统计', '/statistical_analysis']
  ],
  'diag_conf': [navigation, ['诊断计划配置', '/diag_conf/plans'],
    ['全局参数配置', '/diag_conf/global'],
    ['个性化参数配置', '/diag_conf/individuation'],
    ['白名单配置', '/diag_conf/white_list'],
    ['维修单位', '/diag_conf/repair_company'],
    ['诊断服务器', '/diag_conf/diagnose_server']
  ]
}
// 运维系统模块导航配置
export const navigationMenuBusiness = [
  // { name: '运维首页', router: '/operations_homepage', icon: '' },
  {
    name: '设备监测',
    router: '/device_monitor',
    icon: '<i class="icon iconfont">&#xe74e;</i>'
  },
  {
    name: '录像监测',
    router: '/video_monitor',
    icon: '<i class="icon iconfont">&#xe73d;</i>'
  },
  {
    name: '视频诊断',
    router: '/video_diagnosis',
    icon: '<i class="icon iconfont">&#xe78a;</i>'
  },
  {
    name: '资产管理',
    router: '/asset_management',
    icon: '<i class="icon iconfont">&#xe74f;</i>'
  },
  {
    name: '运维日志',
    router: '/operational_log',
    icon: '<i class="icon iconfont">&#xe6db;</i>'
  },
  // { name: '报警中心', router: '/alarm_center', icon: '' },
  // { name: '生命周期', router: '/lifecycle', icon: '' },
  {
    name: '工单管理',
    router: '/workorder_management',
    icon: '<i class="icon iconfont">&#xe797;</i>'
  }
  // { name: '统计分析', router: '/statistical_analysis', icon: '' }
]

// 系统配置模块导航配置
export const navigationMenuConfiguration = [
  // { name: '服务管理', router: '/service_management', icon: '' },
  {
    name: '运维配置',
    router: '/diag_conf',
    icon: '<i class="icon iconfont">&#xe789;</i>'
  }
]

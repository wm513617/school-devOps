module.exports = app => {
  const { router, controller } = app
  // 懒加载机构树
  router.get('/onetree', controller.orgs.getOneTree)
  router.get('/onetree/seek', controller.orgs.getOneTreeSeek)
  router.get('/onetree/getChildNode', controller.orgs.getOneChildNod)
  // 获取机构树
  router.get('/ops/org/tree', controller.orgs.getOrgTree)
  // 获取机构资源树(已分配)
  router.get('/ops/resource/assingedTree', controller.resources.getOrgAssignedResTree)
  // 获取机构资源列表分页(已分配)
  router.get('/ops/resource/assingedList', controller.resources.getOrgAssignedResList)
  // 获取机构设备监测列表分页(已分配)
  router.get('/ops/device/list', controller.deviceMonitor.getDeviceList)
  // 导出设备监测
  router.get('/ops/export/device', controller.deviceMonitor.exportDeviceList)
  // 获取设备表tab上的总条数
  router.get('/ops/device/count', controller.deviceMonitor.getDeviceCount)
  // 获取机构录像监测列表分页(已分配)
  router.get('/ops/video/monitor/list', controller.videoMonitor.getVideoResList)
  // 导出机构录像监测列表分页(已分配)
  router.get('/ops/export/video/monitor/list', controller.videoMonitor.exportVideoResList)
  // 获取录像监测按存储设备机构树
  router.get('/ops/video/storageList', controller.videoMonitor.getStorageList)
  // 导出录像监测表格
  router.get('/ops/export/storageList', controller.videoMonitor.exportStorageList)
  // 获取录像存储服务器
  router.get('/ops/video/storageTree', controller.videoMonitor.getStorageTree)
  // 获取录像设备数量
  router.get('/ops/video/recodestatus', controller.videoMonitor.getRecodeStatus)
  // 获取录像设备数量
  router.get('/ops/video/devrecodestatus', controller.videoMonitor.getDevRecodeStatus)
  // 通过批量设备ip，获取设备当前在线或录制状态和当天相关统计量
  router.post('/ops/devsTodayStatus', controller.influxdb.getDevsTodayStatus)
  // 通过统计类型/设备ip/统计时间段，获取此设备的在线或录制情况
  router.get('/ops/devHistoryStatus', controller.influxdb.getDevHistoryStatus)
  // 通过统计类型/设备ip/统计时间段，获取此设备的录制情况
  router.get('/ops/videoHistoryStatus', controller.videoMonitor.doRecordHistory)
  // 通过批量设备ip/端口/通道号获取录制的累计总时长
  router.post('/ops/devsRecordLog', controller.influxdb.getDevsRecordLog)
  // 视频诊断接口的处理
  router.resources('video-diagnosis', '/ops/proxy', controller.videoDiagnosis)
  // 视频诊断资源树(去掉诊断计划中已配置的资源)
  router.get('/ops/diag/unconfTree', controller.videoDiagnosis.getDiagUnconfResTree)

  // 视频诊断资最后监测列表
  router.get('/ops/diag/final/list', controller.videoDiagnosis.getDiagFinalMonitorData)
  router.get('/ops/diag/final/listExport', controller.videoDiagnosis.getDiagFinalExport)
  router.get('/ops/diag/final/status', controller.videoDiagnosis.getDiagFinalStatus)

  // 视频诊断镜头列表（带分页）
  router.get('/ops/diag/list', controller.videoDiagnosis.getDiagResData)
  router.get('/ops/terraceIp', controller.videoDiagnosis.getTerraceIp)

  // 白名单列表获取
  router.get('/ops/whitelist', controller.videoDiagnosis.getWhitelist)
  // 诊断时间模板获取
  router.get('/ops/timeEmplate', controller.videoDiagnosis.getTimeEmplate)
  // 诊断计划列表（带分页）
  router.get('/ops/planlist', controller.videoDiagnosis.getPlanList)
  router.post('/ops/video/preview', controller.video.getPreviewInfo)
  // 资产管理
  router.get('/ops/assets/count', controller.assetsManagement.assetsCount) // 获取设备总条数
  router.get('/ops/assets/list', controller.assetsManagement.assetseQuipment) // 获取设备列表
  router.get('/ops/assets/assetseExport', controller.assetsManagement.assetseExport) // 导出
  router.get('/ops/assets/particulars', controller.assetsManagement.assetsParticulars) // 获取详情
  router.post('/ops/assets/modification', controller.assetsManagement.assetsModification) // 修改维保信息
  router.post('/ops/assets/bulkEditing', controller.assetsManagement.assetsBulkEditing) // 批量设置维保
  router.get('/ops/assets/ceshi', controller.log.particularsLog) // 获取设备总条数
  // 维保单位
  router.get('/ops/maintenance/list', controller.maintenanceUnit.maintenanceList) // 获取维保单位
  router.post('/ops/maintenance/modification', controller.maintenanceUnit.maintenanceModification) // 修改维保单位信息
  router.post('/ops/maintenance/delete', controller.maintenanceUnit.deleteMany) // 删除维保单位
  router.post('/ops/maintenance/add', controller.maintenanceUnit.addMaintenance) // 添加维保单位
  // 诊断服务器
  router.post('/ops/diagnoseServers/add', controller.servers.addServers) // 添加维保单位
  router.get('/ops/diagnoseServers/list', controller.servers.serversList) // 诊断服务器列表
  router.post('/ops/diagnoseServers/modification', controller.servers.serversModification) // 修改
  router.post('/ops/diagnoseServers/delete', controller.servers.serversDelete) // 删除诊断服务器maintenance
  // 运维日志
  router.get('/ops/log/list', controller.log.selectLog) // 获取运维日志
  router.get('/ops/log/particulars', controller.log.particularsLog) // 获取运维日志详情
  router.get('/ops/log/export', controller.log.exportLog) // 导出运维日志
  // 报警配置
  // Alarm configuration
  router.get('/ops/alarmconfig/gain', controller.alarmconfig.gainAlarmConfig)
  router.post('/ops/alarmconfig/add', controller.alarmconfig.addAlarmConfig)
  // 工单管理
  router.get('/ops/workmanagement/order', controller.workmanagement.getWorkManagementOrder) //  获取工单编号
  router.put('/ops/workmanagement', controller.workmanagement.addWorkManagement) //  添加工单
  router.post('/ops/workmanagement/:id', controller.workmanagement.updateWorkManagement) //  修改工单
  router.post('/ops/workmanagement/confirm/:id', controller.workmanagement.maintenanceConfirm) //  修改工单
  router.get('/ops/workmanagement/tree', controller.workmanagement.getTree) //  按设备类型获取资源机构数
  router.get('/ops/workmanagement/export', controller.workmanagement.exportParticulars) //  获取工单详情
  router.get('/ops/workmanagement', controller.workmanagement.getList) //  获取工单列表
  router.get('/ops/workmanagement/:id', controller.workmanagement.getParticulars) //  获取工单详情
  router.delete('/ops/workmanagement', controller.workmanagement.deleteWork) //  获取工单详情
  router.get('/*', controller.index.render)
}

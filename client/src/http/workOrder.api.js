// import { get, post, put } from './base'
import Vue from 'vue'

export const putAddWorkOrderApi = param => Vue.http({ // 添加工单接口
  method: 'put',
  url: '/ops/workmanagement',
  data: param
})

export const getWorkOrderSerial = () => Vue.http({ // 获取工单编号
  url: '/ops/workmanagement/order'
})

export const getOperationConfigList = () => Vue.http({ // 获取维保厂商接口
  url: '/ops/maintenance/list'
})

export const getWorkOrderInfoApi = id => Vue.http({ // 获取详情信息接口
  url: `/ops/workmanagement/${id}`
})

export const postEditWorkOrderApi = (id, param) => Vue.http({ // 修改工单接口
  method: 'post',
  url: `/ops/workmanagement/${id}`,
  data: param
})

export const postNotarizeOrderApi = (id, param) => Vue.http({ // 维修确认接口
  method: 'post',
  url: `/ops/workmanagement/confirm/${id}`,
  data: param
})

export const removeEditWorkOrderApi = ids => Vue.http({ // 批量删除工单接口
  method: 'delete',
  url: '/ops/workmanagement',
  data: {
    ids
  }
})

export const getWorkOrderListApi = param => Vue.http({ // 获取工单列表接口
  url: `/ops/workmanagement?status=${param.status}&startTime=${param.startTime}&endTime=${param.endTime}&seek=${param.seek}&limit=${param.limit}&page=${param.page}&repairsReason=${param.repairsReason}`
})

export const getDevOrgTreeApi = type => Vue.http({ // 按设备类型获取机构树接口
  url: `/ops/workmanagement/tree?resType=${type}`
})

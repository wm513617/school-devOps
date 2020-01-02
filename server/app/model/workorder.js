/*
 * @Author: dfk 
 * @Date: 2019-05-07 13:31:00 
 * @Last Modified by: dfk
 * @Last Modified time: 2019-05-25 12:22:33
 * 工单管理 存储工单序号  
 */

'use strict'
module.exports = app => {
  const mongoose = app.mongoose
  let Schema = mongoose.Schema
  let workorderSchema = new Schema(
    {
      name: {
        // 查询固定字符 workorder
        type: String
      },
      serialNumber: {
        // 数据库中 最后的工单序号
        type: Number
      }
    },
    { timestamps: true }
  )
  return mongoose.model('WorkOrder', workorderSchema)
}

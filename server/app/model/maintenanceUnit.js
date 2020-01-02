module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  /*
 * 维修单位数据模型
 * @Author: lushengying
 * @Date: 2018-08-29 10:54:45
 * @Last Modified by: dfk
 * @Last Modified time: 2019-08-03 15:41:47
 */

  var MaintenanceUnitSchema = new Schema(
    {
    //  维保厂商名称
      maintenanceVendor: {
        type: String
      },
      //  联系人列表
      contacts: [
        {
        //  联系人名称
          contact: {
            type: String
          },
          //  联系电话
          phone: {
            type: String
          },
          //  邮箱地址
          email: {
            type: String
          }
        }
      ]
    },
    {
      timestamps: true
    }
  )
  return mongoose.model('MaintenanceUnit', MaintenanceUnitSchema)
}

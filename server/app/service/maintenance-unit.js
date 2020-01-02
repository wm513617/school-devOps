const Service = require('egg').Service
const mongoose = require('mongoose')
class MaintenanceUnit extends Service {
  async maintenanceList(page, limit) {
    if (this.ctx.query.id) {
    }
    let select = [
      // { $match: { _id: mongoose.Types.ObjectId(this.ctx.query.id) } },
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
      // {
      //   $project: {
      //     'maintenanceVendor': 1,
      //     'name': 1,
      //     'contacts': {
      //       $filter: {
      //         input: '$contacts',
      //         as: 'item',
      //         cond: {
      //           $and: [{ $ne: [ '$$item.contact', '' ] }, { $ne: [ '$$item.phone', '' ] }]
      //         }
      //       }
      //     }
      //   }
      // }
    ]
    if (this.ctx.query.id) {
      select.unshift({ $match: { _id: mongoose.Types.ObjectId(this.ctx.query.id) } })
    }
    let data = await this.ctx.model.MaintenanceUnit.aggregate(select)
    this.ctx.set({
      'X-BSC-COUNT': data.length,
      'X-BSC-PAGES': Math.ceil(data.length / this.ctx.query.limit),
      'X-BSC-CUR': parseInt(this.ctx.query.page),
      'X-BSC-LIMIT': parseInt(this.ctx.query.limit)
    })
    return data
  }
  async maintenanceModification() {
    return this.ctx.model.MaintenanceUnit.update({ _id: mongoose.Types.ObjectId(this.ctx.query.id) }, this.ctx.request.body, { upsert: true })
  }
  async deleteMany() {
    return this.ctx.model.MaintenanceUnit.deleteMany({ _id: { $in: this.ctx.request.body.ids } })
  }
  async addMaintenance() {
    // if (this.ctx.request.body)
    const maintenance = this.ctx.model.MaintenanceUnit(this.ctx.request.body)
    return maintenance.save()
  }
}
module.exports = MaintenanceUnit

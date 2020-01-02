/*
 * @Author: dfk
 * @Date: 2019-05-25 11:58:04
 * @Last Modified by: dfk
 * @Last Modified time: 2019-08-13 19:46:55
 * 工单管理
 */

const xlsx = require('node-xlsx')
const moment = require('moment')
const Service = require('egg').Service
class WorkManagement extends Service {
  async getSerialNumber () {
    let WorkOrder = this.ctx.model.Workorder
    // 返回工单序号
    let sequenceDocument = await WorkOrder.findOneAndUpdate({ name: 'workorder' }, { $inc: { serialNumber: 1 } }, { new: true, upsert: true })
    return sequenceDocument.serialNumber
  }
  // let orgTree
  async getOrg () {
    // 拼接机构  机构类型为 0
    let Org = this.ctx.model.Orgs
    let findOrg = async (node) => {
      let children = await Org.aggregate([
        { $match: { pid: node._id, type: 0 } },
        { $sort: { order: 1 } },
        { $addFields: { tierType: 'org' } },
        { $project: { name: 1, _id: 1, tierType: 1 } }
      ])
      node.children = children
      if (children.length !== 0) {
        let asyncArr = []
        for (const iterator of children) {
          asyncArr.push(findOrg(iterator))
        }
        await Promise.all(asyncArr)
      } else {

      }
    }

    let root = await Org.findOne({ type: 0, isroot: true }, { name: 1, _id: 1 }).lean()
    root.tierType = 'org'
    await findOrg(root)
    // orgTree = root
    return root
  }
  async findList (ctx, isExport) {
    let Workmanagment = ctx.model.Workmanagment
    let seek = ctx.query.seek || ''
    let page = ctx.query.page ? Number(ctx.query.page) : 1
    let limit = ctx.query.limit ? Number(ctx.query.limit) : 100
    let matchRepairsReason = {}
    // ctx.query.repairsReason 是 5  返回全部类型
    if (Number(ctx.query.repairsReason) !== 5 && ctx.query.repairsReason) {
      matchRepairsReason.repairsReason = Number(ctx.query.repairsReason)
    }
    let select = [
      { $match: { status: Number(ctx.query.status) } },
      { $match: { $and: [{ repairsTime: { $gte: Number(ctx.query.startTime) } }, { repairsTime: { $lte: Number(ctx.query.endTime) } }] } },
      { $match: matchRepairsReason },
      { $match: { deviceList: { $elemMatch: { name: { $regex: seek + '' || '' } } } } },
      { $project: { 'serial': 1, '_id': 1, notarizeTime: 1, repairsTime: 1, deviceList: 1, repairsReason: 1, deviceType: 1, status: 1, repairsName: 1, maintenanceTime: 1, devNameList: 1 } },
      { $sort: { repairsTime: -1 } }
    ]
    let paging = [
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]
    if (isExport) {
      // 导出
      return Workmanagment.aggregate(select)
    } else {
      let [work, count] = await Promise.all([Workmanagment.aggregate([...select, ...paging]), Workmanagment.aggregate([...select, { $count: 'serial' }])])
      let total = count[0] ? count[0].serial : 0
      // return {work: work, total: total}
      ctx.set({
        'X-BSC-COUNT': total,
        'X-BSC-PAGES': Math.ceil(total / limit),
        'X-BSC-CUR': page,
        'X-BSC-LIMIT': limit
      })
      return work
    }
  }
  async addWorkManagement () {
    // 添加工单
    let ctx = this.ctx
    let Workmanagment = this.ctx.model.Workmanagment
    try {
      let document = ctx.request.body
      if (ctx.request.body.deviceList.length === 0) {
        ctx.throw(500, { message: '数据不能为空！' })
      }
      if (!document.serial) {
        ctx.throw(500, { message: 'serial数据不能为空！' })
      }
      let work = new Workmanagment(document)
      if (!document.isSmsAlert) {
        // 不发送短信
        return work.save()
      }
      // 工单添加成功 调用短信猫 发送短信
      let platform = await ctx.model.Sysparamters.findOne({}, 'name').lean()
      // repairsReason: {
      //   // 报修原因 0: 设备离线,  1: 设备异常, 2: 录像异常, 3: 视频质量异常, 4: 其他
      //   type: Number,
      //   enum: [0, 1, 2, 3, 4]
      // },
      let typeName = {
        0: '设备离线',
        1: '设备异常',
        2: '录像异常',
        3: '视频质量异常',
        4: '其他'
      }
      // 查询维保厂商信息
      let manufacturer = await this.ctx.model.MaintenanceUnit.find({ _id: document.maintenanceVendor }, { 'contacts': { $elemMatch: { '_id': document.linkman } } })
      let contentString = `${manufacturer[0].contacts[0].contact}你好,${platform.name}:"${document.devNameList}"发生${typeName[document.repairsReason]}, 请于${moment(document.maintenanceTime * 1000).format('YYYY-MM-DD')}前完成维修`
      contentString = contentString.replace(/\n\r|\n|\r/g, '')
      let device = await this.ctx.model.Devices.findOne({ bigtype: 10 }, 'ip cport')
      let messageContent = {
        devIp: device.ip,
        devPort: device.cport,
        recvNumber: [manufacturer[0].contacts[0].phone],
        sendMessage: contentString
      }
      let res = await this.ctx.curl(`${this.ctx.app.config.storageDevice}/api/ctl/simsendmessage`, { timeout: 15000, contentType: 'json', dataType: 'json', method: 'POST', data: messageContent })
      if (res.status !== 200) {
        ctx.throw({ message: '发送短信失败' })
      }
      return work.save()
    } catch (err) {
      ctx.throw(err)
    }
  }
  async getTree () {
    let ctx = this.ctx
    let OrgRes = this.ctx.model.OrgRes
    let Device = this.ctx.model.Devices
    let Resource = this.ctx.model.Resources
    let Org = this.ctx.model.Orgs
    let alarmClient = this.ctx.model.Client
    try {
      let findRes = async (org, model, types, equType) => {
        let select = []
        if (model === 'res') {
          let res = await OrgRes.find({ org: org._id }, { resource: 1 })
          let resIds = res.map(item => { return item.resource }) // 获取该机构下 所有资源的 id
          select = [
            { $match: { _id: { $in: resIds } } },
            { $match: { 'type': { $in: types } } },
            { $addFields: { tierType: 'res' } },
            { $project: { 'name': 1, '_id': 1, tierType: 1, ip: 1 } }
          ]
          let childrenRes = await Resource.aggregate(select)
          org.children = [...org.children, ...childrenRes]
        } else if (model === 'equ') {
          let match = {
            bigtype: { $in: types }
          }
          if (equType) {
            match.type = equType
          }
          select = [
            { $match: { oid: org._id } },
            { $match: match },
            { $addFields: { tierType: 'equ' } },
            { $project: { 'name': 1, '_id': 1, tierType: 1, ip: 1 } }
          ]
          let childrenDev = await Device.aggregate(select)
          org.children = [...org.children, ...childrenDev]
        } else if (model === 'all') {
          // 返回 机构 设备 资源 树
          select = [
            { $match: { oid: org._id } },
            { $match: { bigtype: { $in: types } } },
            // { $addFields: { tierType: 'equ' } },
            { $lookup: { from: 'resources', localField: '_id', foreignField: 'eid', as: 'children' } },
            // { $addFields: { 'children.tierType': 'res' } },
            { $project: { 'name': 1, '_id': 1, tierType: 1, ip: 1, 'children.name': 1, 'children._id': 1, 'children.tierType': 1, 'children.ip': 1 } }
          ]
          let childrenDev = await Device.aggregate(select)
          org.children = [...org.children, ...childrenDev]
        }
      }
      let joint = async (org, model, types, equType) => {
        if (org.tierType === 'org') { // 是机构再去查资源
          await findRes(org, model, types, equType)
          let asyncArr = []
          for (const iterator of org.children) {
            asyncArr.push(joint(iterator, model, types, equType))
          }
          await Promise.all(asyncArr)
        }
      }
      // 0:摄像机、1:录像机、2:报警主机、3:消防主机、4:报警探头(报警输入)、5:消防探头(消防报警输入)、6:报警柱、7:报警箱、8:闸机、9:解码器、10:网络键盘、11:拼接控制器、12:其他
      // let resourceType = [0, 4, 5]
      let resourceType = [4, 5]
      let deviceType = [0, 1, 2, 3, 9, 10, 11]
      let alarmType = [6, 7]
      let model, types, equType
      if (resourceType.includes(Number(ctx.query.resType))) {
        let orgTree = await ctx.service.workmanagement.getOrg()
        // 查资源表
        // 0：视频通道 1：视频报警输入 2：视频报警输出通道 3：对讲通道 4：门禁通道 5：解码通道 6：音频通道 7：解码报警输入 8：解码报警输出 9：报警主机报警输入 10：报警主机报警输出 11：消防输入防区 12：消防输出防区 ,15 拼接输入通道
        model = 'res'
        if (Number(ctx.query.resType) === 4) {
          types = [1, 7, 9]
        } else if (Number(ctx.query.resType) === 5) {
          types = [11]
        } else if (Number(ctx.query.resType) === 0) {
          types = [0]
        }
        await joint(orgTree, model, types)
        return orgTree
      }
      if (deviceType.includes(Number(ctx.query.resType))) {
        // 查设备表
        let orgTree = await ctx.service.workmanagement.getOrg()
        // let orgTree = orgTree || await getOrg()
        model = 'equ'
        switch (Number(ctx.query.resType)) {
          case 0:
            types = [0]
            // equType = 'ipc'
            model = 'all'
            break
          case 1:
            types = [0]
            equType = 'nvr'
            break
          case 2:
            types = [1]
            equType = undefined
            break
          case 3:
            types = [7]
            equType = undefined
            break
          case 9:
            types = [5]
            equType = undefined
            break
          case 10:
            types = [6]
            equType = undefined
            break
          case 11:
            types = [9]
            equType = undefined
            break
        }
        await joint(orgTree, model, types, equType)
        return orgTree
      }
      if (alarmType.includes(Number(ctx.query.resType))) {
        // 没有机构关系的 数据 放在 跟机构下  只显示跟机构
        let alaType
        if (Number(ctx.query.resType) === 6) {
          alaType = 'alarmPillar'
        } else {
          alaType = 'alarmBox'
        }
        let root = await Org.findOne({ type: 0, isroot: true }, { name: 1, _id: 1 }).lean()
        root.tierType = 'org'
        let children = await alarmClient.aggregate([
          { $match: { deviceType: alaType } },
          { $addFields: { tierType: 'equ' } },
          { $project: { 'name': 1, '_id': 1, tierType: 1, talkIp: 1 } }
        ])
        children.map(item => {
          item.ip = item.talkIp
          return item
        })
        root.children = children
        return root
      }
      if (![...resourceType, ...deviceType, ...alarmType].includes(Number(ctx.query.resType))) {
        let root = await Org.findOne({ type: 0, isroot: true }, { name: 1, _id: 1 }).lean()
        root.tierType = 'org'
        root.children = []
        return root
      }
    } catch (err) {
      ctx.throw(err)
    }
  }
  async getList () {
    let ctx = this.ctx
    try {
      // let work = await ctx.service.WorkManagement.findList(ctx)
      return ctx.service.workmanagement.findList(ctx)
    } catch (err) {
      ctx.throw(err)
    }
  }
  async getParticulars () {
    let ctx = this.ctx
    let Workmanagment = this.ctx.model.Workmanagment
    try {
      return Workmanagment.find({ _id: ctx.params.id })
    } catch (err) {
      ctx.throw(err)
    }
  }
  async updateWorkManagement () {
    let ctx = this.ctx
    let Workmanagment = this.ctx.model.Workmanagment
    try {
      if (ctx.request.body.deviceList.length === 0) {
        ctx.throw(404, { message: '数据不能为空！' })
      }
      return Workmanagment.updateOne({ _id: ctx.params.id }, ctx.request.body)
    } catch (err) {
      ctx.throw(err)
    }
  }
  async deleteWork () {
    let ctx = this.ctx
    let Workmanagment = this.ctx.model.Workmanagment
    try {
      if (!ctx.request.body.ids.length) {
        ctx.throw(404, { message: '数据不能为空！' })
      }
      return Workmanagment.deleteMany({ _id: { $in: ctx.request.body.ids } })
    } catch (err) {
      ctx.throw(err)
    }
  }
  async maintenanceConfirm () {
    let ctx = this.ctx
    let Workmanagment = this.ctx.model.Workmanagment
    try {
      let filed = ['notarizeName', 'notarizeTime', 'accendant', 'accendantPhone', 'remark']
      let updateObj = {}
      for (const iterator of filed) {
        updateObj[iterator] = ctx.request.body[iterator]
      }
      updateObj.status = 1
      return Workmanagment.updateOne({ _id: ctx.params.id }, { $set: updateObj })
    } catch (err) {
      ctx.throw(err)
    }
  }
  async exportParticulars () {
    let ctx = this.ctx
    try {
      let list = await ctx.service.workmanagement.findList(ctx, true)
      let data = [
        [
          '工单编号',
          '确认时间',
          '设备名称',
          '报修原因',
          '设备类型',
          '工单状态',
          '上报人',
          '预计维修完成时间'
        ]
      ]
      let fieldNames = [
        'serial',
        'notarizeTime',
        'deviceList',
        'repairsReason',
        'deviceType',
        'status',
        'repairsName',
        'maintenanceTime'
      ]
      let repairsReasonObj = {
        0: '设备离线',
        1: '设备异常',
        2: '录像异常',
        3: '视频质量异常',
        4: '其他'
      }
      let deviceTypeObj = {
        0: '摄像机',
        1: '录像机',
        2: '报警主机',
        3: '消防主机',
        4: '报警探头',
        5: '消防探头',
        6: '报警柱',
        7: '报警箱',
        8: '闸机',
        9: ':解码器',
        10: '网络键盘',
        11: '拼接控制器',
        12: '其他'
      }
      list = list.map(item => {
        return {
          serial: item.serial,
          notarizeTime: moment(item.notarizeTime * 1000).format('YYYY-MM-DD HH:mm:ss'),
          deviceList: item.deviceList.map(item => { return item.name }).join(','),
          repairsReason: repairsReasonObj[item.repairsReason],
          deviceType: deviceTypeObj[item.deviceType],
          status: item.status === 1 ? '维修完成' : '待维修',
          repairsName: item.repairsName,
          maintenanceTime: moment(item.maintenanceTime * 1000).format('YYYY-MM-DD HH:mm:ss')
        }
      })
      list.forEach(element => {
        let arr = []
        for (const iterator of fieldNames) {
          arr.push(element[iterator])
        }
        data.push(arr)
      })
      let tableHeaderXlsx = '已完成工单'
      let buffer = xlsx.build([{ name: tableHeaderXlsx, data }])
      const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
      this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
      let filename = `${tableHeaderXlsx}-${timeStr}.xlsx`
      return { buffer, filename }
    } catch (err) {
      ctx.throw(err)
    }
  }
}
module.exports = WorkManagement

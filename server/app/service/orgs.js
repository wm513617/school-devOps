const Service = require('egg').Service
const mongoose = require('mongoose')

const treeClidren = async (ctx, isLoad = true) => {
  // let ctx = this.ctx
  // let Org = ctx.model.Orgs
  let OrgRes = ctx.model.OrgRes
  let Device = ctx.model.Devices
  let Resource = ctx.model.Resources
  // type为0表示现场机构类型
  let equtype = ctx.query.equtype
    ? ctx.query.equtype.split(',').map(item => {
      return Number(item)
    })
    : [0]
  let restype = ctx.query.restype
    ? ctx.query.restype.split(',').map(item => {
      return Number(item)
    })
    : [0]
  // 分三种情况 1.只显示机构 2.显示机构和资源 3.显示机构设备资源
  // 如果equipment为true则表示是机构设备资源树
  if (ctx.query.equipment === 'true') {
    // 如果有eid则表示点击的是设备节点，直接查找资源
    if (ctx.query.eid) {
      // 机构-设备-资源树 现实的是 未分配的资源
      // 先查询已分配的资源
      let matchObj = { $and: [{ type: { $in: restype } }, { eid: mongoose.Types.ObjectId(ctx.query.eid) }] }
      let selectRes = [{ $match: matchObj }, { $addFields: { tierType: 'res' } }, { $project: { name: 1, _id: 1, ip: 1 } }]
      const data = await Resource.aggregate(selectRes)
      // return data
      if (isLoad) {
        return data
      } else {
        return {
          org: [],
          res: data,
          dev: []
        }
      }
    } else {
      // 没有eid表示点击的是机构节点，查机构下对应的机构和设备
      let selectEqu = [
        { $match: { $and: [{ oid: mongoose.Types.ObjectId(ctx.query.oid) }, { bigtype: { $in: equtype } }] } },
        { $addFields: { equip: true, tierType: 'equ' } }, // equip字段 是报警处理 用来判断是设备还是机构的字段 tierType是新写的 拦截载用来判断是设备还是在资源的字段
        { $project: { name: 1, _id: 1, ip: 1 } }
      ]
      let [org, dev] = await Promise.all([treeOrg(ctx), Device.aggregate(selectEqu)])
      // return await Device.aggregate(selectEqu)
      if (isLoad) {
        return [...org, ...dev]
      } else {
        return {
          org: org,
          dev: dev,
          res: []
        }
      }
    }
  } else if (ctx.query.resource === 'true') {
    // 如果resource为true则表示是机构设备资源树
    // // 如果是超级管理员拥有所有资源权限
    let matchObj = { 'resources.type': { $in: restype } }
    // 地图应用 机构资源树 只显示 应用过的 （有 point 字段） 并且符合 mapId
    let filtrationMapId = {}
    let filtrationAbout = {}
    if (ctx.query.mapType === '2D') { // 地图2d过滤
      if (ctx.query.mapId) {
        filtrationMapId['resources.point.mapId'] = mongoose.Types.ObjectId(ctx.query.mapId)
      }
      // 地图 楼内 楼外过滤
      if (ctx.query.storeyId) {
        if (Number(ctx.query.storeyId) === 1) {
          filtrationAbout['$nor'] = [ { 'resources.point.isouter': false } ]
        } else {
          filtrationAbout['$or'] = [ { $and: [{ 'resources.point.isouter': false }, { 'resources.point.sid': mongoose.Types.ObjectId(ctx.query.storeyId) }] }, { 'resources.point': { $exists: false } } ]
        }
      }
    }
    // 地图3d过滤
    if (ctx.query.mapType === '3D') {
      if (ctx.query.storeyId) {
        if (Number(ctx.query.storeyId) === 1) {
          filtrationAbout['$nor'] = [ { 'resources.point3D.isouter': false } ]
        } else {
          filtrationAbout['$or'] = [ { $and: [{ 'resources.point3D.isouter': false }, { 'resources.point3D.sid': mongoose.Types.ObjectId(ctx.query.storeyId) }] }, { 'resources.point3D': { $exists: false } } ]
        }
      }
    }

    // 地图过滤报警箱报警柱
    let filtrationEidType = {}
    if (ctx.query.mapType) {
      // 地图机构树不要报警箱上的针孔摄像头
      filtrationEidType['eid.type'] = { $nin: ['alarmBox', 'alarmPillar'] }
    }
    // 显示资源
    let selectRes = [
      { $match: { org: mongoose.Types.ObjectId(ctx.query.oid) } },
      { $lookup: { from: 'resources', localField: 'resource', foreignField: '_id', as: 'resources' } },
      { $match: matchObj },
      { $match: filtrationMapId }, // 地图过滤
      { $match: filtrationAbout }, // 地图过滤
      { $lookup: { from: 'devices', localField: 'resources.eid', foreignField: '_id', as: 'eid' } },
      { $match: filtrationEidType },
      {
        $project: {
          'tierType': 1,
          'resources.monitoryPointGenera': 1,
          'resources.gbPlaDevIp': 1,
          'resources.gbPlaDevPort': 1,
          'resources.type': 1,
          'resources.point': 1,
          'resources.point3D': 1,
          'resources.mapsign': 1,
          'resources.shareServer': 1,
          'resources.nodeId': 1,
          'resources.name': 1,
          'resources._id': 1,
          'resources.gbDevId': 1,
          'resources.chan': 1,
          'resources.gbParentDevId': 1,
          'resources.monitortype': 1,
          'resources.pinyin': 1,
          'resources.status': 1,
          'resources.stream': 1,
          'eid.ip': 1,
          'eid.cport': 1,
          'eid.dport': 1,
          'eid.manufacturer': 1,
          'eid.name': 1,
          'eid.type': 1,
          'eid._id': 1,
          'eid.deviceStatus': 1,
          'eid.status': 1
        }
      }
    ]
    let [org, res] = await Promise.all([treeOrg(ctx), OrgRes.aggregate(selectRes)])
    res = res.filter(item => {
      // 20.7 数据库 有 没有设备的资源
      if (item.eid.length) {
        return true
      } else {
        return false
      }
    })
    res = res.map(item => {
      return {
        monitoryPointGenera: item.resources[0].monitoryPointGenera,
        mapsign: item.resources[0].mapsign,
        point: item.resources[0].point,
        point3D: item.resources[0].point3D,
        type: item.resources[0].type,
        tierType: 'res',
        chan: item.resources[0].chan,
        eid: {
          cport: item.eid[0].cport,
          dport: item.eid[0].dport,
          ip: item.eid[0].ip,
          manufacturer: item.eid[0].manufacturer,
          name: item.eid[0].name,
          type: item.eid[0].type,
          status: item.eid[0].status,
          deviceStatus: item.eid[0].deviceStatus,
          _id: item.eid[0]._id
        },
        gbDevId: item.resources[0].gbDevId,
        gbParentDevId: item.resources[0].gbParentDevId,
        gbPlaDevIp: item.resources[0].gbPlaDevIp,
        gbPlaDevPort: item.resources[0].gbPlaDevPort,
        monitortype: item.resources[0].monitortype,
        name: item.resources[0].name,
        pinyin: item.resources[0].pinyin,
        status: item.resources[0].status,
        stream: item.resources[0].stream,
        shareServer: item.resources[0].shareServer,
        nodeId: item.resources[0].nodeId,
        _id: item.resources[0]._id
      }
    })
    if (isLoad) {
      return [...org, ...res]
    } else {
      return {
        org,
        res,
        dev: []
      }
    }
  } else {
    // 机构树，只显示机构
    const data = await treeOrg(ctx)
    if (isLoad) {
      return data
    } else {
      return {
        org: data,
        res: [],
        dev: []
      }
    }
  }
}

const treeOrg = async (ctx) => {
  // 获取机构下的机构
  let Org = ctx.model.Orgs
  if (ctx.query.oid) {
    let selectOrg = [
      // 为了让前端机构树显示箭头
      { $match: { pid: mongoose.Types.ObjectId(ctx.query.oid) } },
      { $addFields: { tierType: 'org' } }, // 为了让前端机构树显示箭头
      { $sort: { order: 1 } },
      { $project: { isroot: 1, code: 1, name: 1, order: 1, pid: 1, pinyin: 1, _id: 1, children: 1, tierType: 1 } }
    ]
    const data = await Org.aggregate(selectOrg)
    return data
  }
}
class OrgsService extends Service {
  // 获取根机构ID
  async getRoot (type = 0) {
    const data = await this.ctx.model.Orgs.findOne({ type: type, isroot: true }, '_id').exec()
    return data
  }
  // 获取所有机构
  async getAll (type = 0) {
    const data = await this.ctx.model.Orgs.find({ type: type }, '_id name pid order isroot code pinyin shareServer').sort('order').exec()
    return data
  }
  // 传机构ID数组获取对应
  async getByIds (allChildrenIds) {
    const data = await this.ctx.model.Orgs.find({ _id: { $in: allChildrenIds } }, '_id name pid order isroot code pinyin shareServer').sort({ order: 1 }).lean().exec()
    return data
  }
  // 懒加载树
  async getOneTree() {
    let ctx = this.ctx
    let Org = ctx.model.Orgs
    if (!ctx.query.oid && !ctx.query.eid) {
      // 首次获取机构树只返回根机构信息
      let selectOrg = [
        { $match: { $and: [{ type: Number(ctx.query.orgtype) }, { isroot: true }] } },
        { $addFields: { children: [{ _id: 1 }], tierType: 'org' } }, // 添加children字段为了让前端机构树显示箭头
        { $project: { isroot: 1, code: 1, name: 1, order: 1, pid: 1, pinyin: 1, _id: 1, children: 1, tierType: 1 } }
      ]
      const data = await Org.aggregate(selectOrg)
      return data
    } else {
      // 非首次请求获取机构下的数据
      const data = await treeClidren(ctx)
      return data
    }
  }
  // 懒加载树搜索
  async getOneTreeSeek() {
    let ctx = this.ctx
    let Org = ctx.model.Orgs
    let Resource = ctx.model.Resources
    if (ctx.query.orgseek !== undefined) {
      // 搜索机构  按名称搜索
      let selectOrg = [
        // { $match: { $and: [{ type: Number(ctx.query.orgtype)}, { isroot: { $ne: true }}] } },
        { $match: { $and: [{ type: Number(ctx.query.orgtype) }] } },
        // { $match: { type: Number(ctx.query.orgtype) } },
        { $match: { $or: [{ name: { $regex: ctx.query.orgseek + '' || '' } }] } },
        { $addFields: { tierType: 'org' } },
        {
          $project: {
            isroot: 1,
            code: 1,
            name: 1,
            order: 1,
            pid: 1,
            pinyin: 1,
            _id: 1,
            children: 1,
            tierType: 1,
            type: 1
          }
        }
      ]
      let body = await Org.aggregate(selectOrg)
      return body
    }
    if (ctx.query.resseek !== undefined) {
      let restype = ctx.query.restype
        ? ctx.query.restype.split(',').map(item => {
          return Number(item)
        })
        : [0] // 默认查资源类型 为 0
      let matchObj = { type: { $in: restype }, 'resources.shareServer': { $exists: false } }
      let selectRes = [
        { $match: matchObj },
        {
          $match: {
            $or: [{ name: { $regex: ctx.query.resseek + '' || '' } }, { ip: { $regex: ctx.query.resseek + '' || '' } }]
          }
        },
        { $addFields: { tierType: 'res' } },
        { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'eid' } },
        {
          $project: {
            monitoryPointGenera: 1,
            gbPlaDevIp: 1,
            gbPlaDevPort: 1,
            type: 1,
            point: 1,
            point3D: 1,
            mapsign: 1,
            tierType: 1,
            shareServer: 1,
            nodeId: 1,
            name: 1,
            _id: 1,
            gbDevId: 1,
            chan: 1,
            gbParentDevId: 1,
            monitortype: 1,
            pinyin: 1,
            status: 1,
            stream: 1,
            'eid.ip': 1,
            'eid.cport': 1,
            'eid.dport': 1,
            'eid.manufacturer': 1,
            'eid.name': 1,
            'eid.type': 1,
            'eid._id': 1,
            'eid.deviceStatus': 1
          }
        }
      ]
      // childrenSeek = Resource.aggregate(selectRes)
      let res = await Resource.aggregate(selectRes)
      res = res.filter(item => {
        // 20.7 数据库 有 没有设备的资源
        if (item.eid.length) {
          return true
        } else {
          return false
        }
      })
      res = res.map(item => {
        if (!item.eid.length) {
          return null
        }
        return {
          monitoryPointGenera: item.monitoryPointGenera,
          mapsign: item.mapsign,
          point: item.point,
          point3D: item.point3D,
          type: item.type,
          tierType: 'res',
          chan: item.chan,
          eid: {
            cport: item.eid[0].cport,
            dport: item.eid[0].dport,
            ip: item.eid[0].ip,
            manufacturer: item.eid[0].manufacturer,
            name: item.eid[0].name,
            type: item.eid[0].type,
            status: item.eid[0].status,
            deviceStatus: item.eid[0].deviceStatus,
            _id: item.eid[0]._id
          },
          gbPlaDevIp: item.gbPlaDevIp,
          gbPlaDevPort: item.gbPlaDevPort,
          gbDevId: item.gbDevId,
          gbParentDevId: item.gbParentDevId,
          monitortype: item.monitortype,
          name: item.name,
          pinyin: item.pinyin,
          status: item.status,
          stream: item.stream,
          shareServer: item.shareServer,
          nodeId: item.nodeId,
          _id: item._id
        }
      })
      return res
    }
  }
  async getOneChildNod() {
    // 获取该机构下所有的机构和资源
    let ctx = this.ctx
    // try {
    let orgTree = {}
    let orgId = []
    let resourceId = []
    let getChild = async (oid, orgTree) => {
      ctx.query.oid = oid
      let firstFloorRes = await treeClidren(ctx, false)
      console.log(firstFloorRes, 'firstFloorRes')
      // orgId = [...orgId, ...firstFloorRes.org.map(item => { return item._id })]
      // resourceId = [...resourceId, ...firstFloorRes.res.map(item => { return item._id })]
      if (firstFloorRes.dev !== 0) {
        for (const iterator of firstFloorRes.dev) {
          ctx.query.equ = iterator._id
          let firstFloorDev = await treeClidren(ctx, false)
          iterator.children = firstFloorDev.dev
        }
      }
      orgTree.children = [...firstFloorRes.org, ...firstFloorRes.dev]
      if (firstFloorRes.org.length !== 0) {
        for (const iterator of firstFloorRes.org) {
          if (iterator.tierType === 'org') {
            await getChild(iterator._id, iterator)
          }
        }
      }
    }
    let oid = ctx.query.oid
    if (!oid) {
      ctx.throw(500, { code: 1019, message: '请传入正确oid' })
    }
    await getChild(oid, orgTree)
    return {
      tree: orgTree.children,
      orgId,
      resourceId
    }
    // } catch (err) {
    //   ctx.throw(500, { code: 1010, message: '机构树获取失败', err: err })
    //   console.log('机构树获取失败：' + err)
    // }
  }
}
module.exports = OrgsService

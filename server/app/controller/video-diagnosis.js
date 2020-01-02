/* eslint-disable no-tabs */
const _ = require('lodash')

const httpHelper = async (ctx, cfg, body) => {
  let host = ctx.app.config.videoDiagnosisHost
  const urlArr = cfg.url.split('=')
  let url
  if (urlArr[1]) {
    url = `${host}${urlArr[0] + `=` + encodeURI(urlArr[1])}`
    if (cfg.task) {
      url = `${url}=${urlArr[2]}&task=${encodeURI(cfg.task)}`
    }
  } else {
    url = `${host}${urlArr[0]}`
  }
  const method = cfg.method
  const data = body
  if (method.toLowerCase() === 'get') {
    if (cfg.max || cfg.page) {
      url = url + `&page=${cfg.page}&max=${cfg.max}`
    }
    const result = await ctx.curl(url, {
      dataType: 'json',
      ContentType: 'application/json; charset=utf-8'
    })
    ctx.body = result.data
  } else {
    const result = await ctx.curl(url, {
      method,
      contentType: 'json',
      data,
      dataType: 'json',
      timeout: 10 * 60 * 1000
    })
    ctx.body = result.data
  }
}
exports.index = async (ctx) => {
  // GET
  await httpHelper(ctx, {
    ...ctx.query
  })
}

exports.create = async (ctx) => {
  // POST
  await httpHelper(ctx, { ...ctx.query }, ctx.request.body.data)
}

exports.getDiagUnconfResTree = async (ctx) => {
  const params = {
    oid: ctx.query.oid,
    taskname: ctx.query.taskname,
    orgtype: ctx.query.orgtype,
    restype: ctx.query.restype,
    tasktype: ctx.query.tasktype
  }
  const result = await ctx.service.videoDiagnosis.getDiagUnconfResTree(params)
  ctx.body = result
}

/**
 * @name getDiagFinalMonitorData 设备列表分页查询
 * @query oid 机构ID
 * @query limit 页大小
 * @query seek 查询字段
 * @query page 分页
 * @query sub 是够显示子机构 1 是 0 否
 * @query status 1在线 0全部 -1不在线
 * @query snece 异常场景全部为all其余 0-8 md...ptz
*/
exports.getDiagFinalMonitorData = async (ctx) => {
  if (!_.isEmpty(ctx.query.seek)) {
    ctx.query.seek = ctx.query.seek.replace(/\./g, '\\.')
  }
  const params = {
    oid: ctx.query.oid || '',
    seek: ctx.query.seek,
    snece: ctx.query.snece || 'all',
    page: ctx.query.page || 1,
    limit: ctx.query.limit || 20,
    sub: ctx.query.sub || '1',
    status: ctx.query.status || '0'
  }
  const [data, count] = await ctx.service.videoDiagnosis.getDiagFinalMonitorData(params)
  ctx.set({
    'X-BSC-COUNT': count,
    'X-BSC-PAGES': Math.ceil(count / params.limit),
    'X-BSC-CUR': parseInt(params.page),
    'X-BSC-LIMIT': parseInt(params.limit)
  })
  ctx.body = data
}
/**
 *视频诊断导出
 *
 */
exports.getDiagFinalExport = async (ctx) => {
  const xlsx = await ctx.service.videoDiagnosis.getDiagFinalExport()
  ctx.set('Content-Type', 'application/vnd.openxmlformats')
  let name = encodeURI(xlsx.filename, 'utf-8')
  ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
  ctx.body = xlsx.buffer
}
// 白名单列表获取
exports.getWhitelist = async (ctx) => {
  ctx.body = await ctx.service.videoDiagnosis.getGalleryWhitelist()
}
// 时间模板获取
exports.getTimeEmplate = async (ctx) => {
  ctx.body = await ctx.service.videoDiagnosis.getInquireTimeEmplate()
}
exports.getDiagResData = async (ctx) => {
  const params = {
    oid: ctx.query.oid || '',
    seek: ctx.query.seek,
    page: ctx.query.page || 1,
    limit: ctx.query.limit || 20,
    sub: ctx.query.sub || '1'
  }
  const [data, count] = await ctx.service.videoDiagnosis.getDiagResData(params)
  ctx.set({
    'X-BSC-COUNT': count,
    'X-BSC-PAGES': Math.ceil(count / params.limit),
    'X-BSC-CUR': parseInt(params.page),
    'X-BSC-LIMIT': parseInt(params.limit)
  })
  ctx.body = data
}
// 诊断计划列表
exports.getPlanList = async (ctx) => {
  let [body, count] = await ctx.service.videoDiagnosis.getClearUpPlanList()
  ctx.set({
    'X-BSC-COUNT': count,
    'X-BSC-PAGES': Math.ceil(count / ctx.query.limit),
    'X-BSC-CUR': parseInt(ctx.query.page),
    'X-BSC-LIMIT': parseInt(ctx.query.limit)
  })
  ctx.body = body
}
// 获取诊断镜头在线离线数量
exports.getDiagFinalStatus = async (ctx) => {
  ctx.body = await ctx.service.videoDiagnosis.getDiagFinalStatus()
}
// 获取校园平台ip
exports.getTerraceIp = async (ctx) => {
  ctx.body = { ip: ctx.app.config.videoHost }
}
/*
【测试用例】
1.定时任务的增加
post方式
/proxy
{
	"data": {
		"method": "PUT",
		"url": "/vd/task",
		"name": "abc-123",
		"type": "time",
		"enable": "enable",
		"schedule": [{
			"index": 0,
			"start": "00:00:01",
			"end": "23:59:59"
		}],
		"para": [{
			"name": "sc",
			"sens": 3,
			"enable": "enable"
		}, {
			"name": "ac",
			"sens": 4,
			"enable": "enable"
		}]
	}
}
2.定时任务的删除
post方式
/proxy
{
	"data": {
		"method": "DELETE",
		"url": "/vd/task?name=taskname"
	}
}
3.定时任务的修改
post方式
/proxy
{
	"data": {
		"method": "POST",
		"url": "/vd/task?name=taskname",
        "name": "abc-123",
        "type": "time",
        "enable": "disable",
        "schedule": [{
            "index": 0,
            "start": "00:00:01",
            "end": "23:59:59"
        }],
        "para": [{
            "name": "sc",
            "sens": 3,
            "enable": "enable"
        }, {
            "name": "ac",
            "sens": 4,
            "enable": "enable"
        }]
	}
}
4.定时任务的查询
get方式
/proxy?method=GET&url=/vd/task
*/

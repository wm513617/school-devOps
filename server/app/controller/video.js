const Controller = require('egg').Controller
class VideoController extends Controller {
  // 根据机构类型获取机构树
  async getPreviewInfo () {
    const ctx = this.ctx
    let data = ctx.request.body
    let url = `http://${ctx.app.config.videoHost}/api/ctl/video?type=video`
    let result = await ctx.curl(url, {
      method: 'post',
      contentType: 'json',
      dataType: 'json',
      data
    })
    ctx.body = result.data
  }
}
module.exports = VideoController

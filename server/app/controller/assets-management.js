const Controller = require('egg').Controller
class AssetsManagementController extends Controller {
  // /**
  //  * @description:
  //  * @param {oid} 机构id
  //  * @return: 返回该机构下所有的子机构
  //  */
  // async descendantOrg(oid) {

  // }
  // /**
  //  * @description: 查询机构下的所有设备数
  //  * @param {type} 0：摄像机 1：录像机 2：报警主机 3：消防主机 4：报警输入 5：消防输入 6：报警箱 7：闸机 8：解码器 9：服务器 10：网络键盘 11：拼接控制器
  //  * @param {oid} 机构id
  //  * @return: 设备总数
  //  */
  // async queriesCount(oid, type) {

  // }
  async assetsCount() {
    this.ctx.body = await this.ctx.service.assetsManagement.assetsCount()
  }
  async assetseQuipment() { // 资产管理查列表
    console.log(this.ctx.query.seek)
    console.log(this.ctx.query.state, 339999999999999)
    console.log(Boolean(this.ctx.query.state))
    // this.ctx.query.state = this.ctx.query.state ? Number(this.ctx.query.state) : undefined
    this.ctx.query.seek = this.ctx.query.seek || ''
    this.ctx.query.page = this.ctx.query.page || 1
    this.ctx.query.limit = this.ctx.query.limit || 25
    this.ctx.body = await this.ctx.service.assetsManagement.assetseQuipment()
  }
  async assetseExport() {
    let xlsx = this.ctx.body = await this.ctx.service.assetsManagement.assetseExport()
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let name = encodeURI(xlsx.filename, 'utf-8')
    this.ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
    this.ctx.body = xlsx.buffer
  }
  async assetsParticulars() { // 获取详情
    this.ctx.body = await this.ctx.service.assetsManagement.assetsParticulars()
  }
  async assetsModification() { // 修改维保信息
    this.ctx.body = await this.ctx.service.assetsManagement.assetsModification()
  }
  async assetsBulkEditing() {
    this.ctx.body = await this.ctx.service.assetsManagement.assetsBulkEditing()
  }
}
module.exports = AssetsManagementController

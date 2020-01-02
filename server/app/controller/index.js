const Controller = require('egg').Controller
const fs = require('fs')
const path = require('path')
class IndexController extends Controller {
  async render () {
    this.ctx.set('Content-Type', 'text/html')
    this.ctx.body = fs.createReadStream(path.join(__dirname, '../public/index.html'))
  }
}
module.exports = IndexController

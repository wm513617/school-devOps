/**
 * 返回一个节点下的所有子孙节点
 * @param arr 返回数组
 * @param result 传入数据
 * @param 父节点id
 */
const getChildren = (arr, result, pid) => {
  for (var i in result) {
    if (result[i].pid && result[i].pid + '' === pid + '') {
      arr.push(result[i]._id + '')
      getChildren(arr, result, result[i]._id)
    }
  }
  return arr
}
exports.getChildren = getChildren

/**
 * 树形结构转换
 * @param a 数据数组
 * @param idStr id字符串
 * @param pidStr 父id字符串
 * @returns {Array}
 */
exports.transData2Tree = (a, idStr, pidStr, sort = false) => {
  var r = []
  var hash = {}
  var len = a.length
  for (var i = 0; i < len; i++) {
    hash[a[i][idStr]] = a[i]
  }
  for (var j = 0; j < len; j++) {
    var aVal = a[j]
    var hashVP = hash[aVal[pidStr]]
    if (hashVP) {
      !hashVP.children && (hashVP.children = [])
      if (sort) {
        hashVP.children.unshift(aVal)
      } else {
        hashVP.children.push(aVal)
      }
    } else {
      r.push(aVal)
    }
  }
  return r
}

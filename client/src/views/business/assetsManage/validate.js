export const validateNames16 = (rule, value, callback) => {
  if (value === '') { // 不是必填
    return callback()
  }
  let reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (!reg.test(value)) {
    return callback(new Error('请输入小于16位字符的内容'))
  } else {
    // Unicode编码
    let strlen = 0
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        // 如果是汉字，则字符串长度加2
        strlen += 2
      } else {
        strlen++
      }
    }
    if (strlen > 32) {
      return callback(new Error('请输入小于16位字符的内容'))
    } else {
      return callback()
    }
  }
}

export const validateName16 = (rule, value, callback) => {
  // 必填
  let reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (!reg.test(value)) {
    return callback(new Error('请输入小于16位字符的内容'))
  } else {
    // Unicode编码
    let strlen = 0
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        // 如果是汉字，则字符串长度加2
        strlen += 2
      } else {
        strlen++
      }
    }
    if (strlen > 32) {
      return callback(new Error('请输入小于16位字符的内容'))
    } else {
      return callback()
    }
  }
}

export const validateName32 = (rule, value, callback) => {
  // 必填
  let reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (!reg.test(value)) {
    return callback(new Error('请输入小于32位字符的内容'))
  } else {
    // Unicode编码
    let strlen = 0
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        // 如果是汉字，则字符串长度加2
        strlen += 2
      } else {
        strlen++
      }
    }
    if (strlen > 32) {
      return callback(new Error('请输入小于32位字符的内容'))
    } else {
      return callback()
    }
  }
}

export const validateName64 = (rule, value, callback) => {
  if (value === '') { // 不是必填
    return callback()
  }
  let reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (!reg.test(value)) {
    return callback(new Error('请输入小于64位字符的内容'))
  } else {
    // Unicode编码
    let strlen = 0
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        // 如果是汉字，则字符串长度加2
        strlen += 2
      } else {
        strlen++
      }
    }
    if (strlen > 64) {
      return callback(new Error('请输入小于64位字符的内容'))
    } else {
      return callback()
    }
  }
}

export const validateNames64 = (rule, value, callback) => {
  let reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (!reg.test(value)) {
    return callback(new Error('请输入小于64位字符的内容'))
  } else {
    // Unicode编码
    let strlen = 0
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        // 如果是汉字，则字符串长度加2
        strlen += 2
      } else {
        strlen++
      }
    }
    if (strlen > 64) {
      return callback(new Error('请输入小于64位字符的内容'))
    } else {
      return callback()
    }
  }
}

export const validateName128 = (rule, value, callback) => {
  // 不是必填
  if (value === '') {
    return callback()
  }
  let reg = /^[\u4E00-\u9FA5A-Za-z0-9]+$/
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (!reg.test(value)) {
    return callback(new Error('请输入小于128位字符的内容'))
  } else {
    // Unicode编码
    let strlen = 0
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        // 如果是汉字，则字符串长度加2
        strlen += 2
      } else {
        strlen++
      }
    }
    if (strlen > 128) {
      return callback(new Error('请输入小于128位字符的内容'))
    } else {
      return callback()
    }
  }
}

export const validateMail = (rule, value, callback) => {
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  const reg = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/
  if (!reg.test(value)) {
    return callback(new Error('请输入正确邮箱地址'))
  } else {
    return callback()
  }
}

export const validateMail1 = (rule, value, callback) => {
  if (value === '') { // 不是必填
    return callback()
  }
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  const reg = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/
  if (!reg.test(value)) {
    return callback(new Error('请输入正确邮箱地址'))
  } else {
    return callback()
  }
}

export const validateTelephone = (rule, value, callback) => {
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  const reg = /^1[34578]\d{9}$/
  if (!reg.test(value)) {
    return callback(new Error('请输入正确手机号码'))
  } else {
    return callback()
  }
}

export const validateTelephone1 = (rule, value, callback) => {
  if (value === '') { // 不是必填
    return callback()
  }
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  const reg = /^1[34578]\d{9}$/
  if (!reg.test(value)) {
    return callback(new Error('请输入正确手机号码'))
  } else {
    return callback()
  }
}

export const validateIp = (rule, value, callback) => {
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (value.split('.').length !== 4) {
    return callback(new Error('请输入正确ip格式'))
  }
  const reg = /^(((([0-9]{1})([0-9]{1})?)|(1[0-9]{1}[0-9]{1})|(2[0-4]{1}[0-9]{1})|(25[0-5]{1})).){3}((([0-9]{1})([0-9]{1})?)|(1[0-9]{1}[0-9]{1})|(2[0-4]{1}[0-9]{1})|(25[0-5]{1}))$/g
  if (!reg.test(value)) {
    return callback(new Error('请输入正确IP地址'))
  } else {
    return callback()
  }
}

export const validate180 = (rule, value, callback) => {
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (value >= 0 && value <= 180) {
    return callback()
  } else {
    return callback(new Error('请输入0 - 180之间的数字'))
  }
}

export const validate90 = (rule, value, callback) => {
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (value >= 0 && value <= 90) {
    return callback()
  } else {
    return callback(new Error('请输入0 - 90之间的数字'))
  }
}

export const validatePort = (rule, value, callback) => {
  value += ''
  if (value === '') { // 不是必填
    return callback(new Error('请输入0 - 65535之间的数字'))
  }
  if (value.indexOf(' ') !== -1) {
    return callback(new Error('不能输入空格'))
  }
  if (value >= 0 && value <= 65535) {
    return callback()
  } else {
    return callback(new Error('请输入0 - 65535之间的数字'))
  }
}

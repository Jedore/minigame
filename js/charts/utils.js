/* 
 * deepCopy
 */
const deepCopy = function(obj) {
  if (obj instanceof Object) {
    let newObj = obj.constructor === Array ? [] : {}
    for (let i in obj) {
      newObj[i] = deepCopy(obj[i])
    }
    return newObj
  } else {
    return obj
  }
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/* format date time 
 *  timestamp: +new Date()
 */
const formatDateTime = function(timestamp){
  let d = new Date(timestamp),
    month = (d.getMonth() + 1),
    day = d.getDate(),
    year = d.getFullYear(),
    hour = d.getHours(),
    minute = d.getMinutes(),
    second = d.getSeconds()
  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

module.exports = {
  deepCopy: deepCopy,
  formatDateTime: formatDateTime,
}

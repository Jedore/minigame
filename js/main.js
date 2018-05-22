var gKline = require('./charts/k-line.js')
var gOrderView= require('./charts/scroll-view.js')
var chartUtil = require('./charts/utils.js')

const areaType = {
  kline: 'kline',
  order: 'order',
  buy: 'buy',
  sell: 'sell',
  other: 'other',
}

const BS = {
  buy: 'B',
  sell: 'S'
}

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    this.edgeTop = 50
    this.edgeBottom = 20
    this.edgeLeft = 20
    this.edgeRight = 20

    this.optionKLine = {
      unit: 30,
      edgeLeft: this.edgeLeft,
      edgeTop: this.edgeTop,
      edgeRight: this.edgeRight,
      edgeBottom: 400,
      paddingTop: 10,
      paddingBottom: 15,
      paddingLeft: 10,
      paddingRight: 10,
      candleGap: 4,
      showXLine: true,
      showYLine: true,
      bgColor: 'black',
    }
    this.optionOrder = {
      bgColor: "#1C1F27",
      rowNum: 10,
      colNum: 5,
      rowH: 20,
      colW: 50,
      edgeLeft: this.edgeLeft,
      edgeTop: 400,
      edgeRight: this.edgeRight,
      edgeBottom: this.edgeBottom,
      lineColor: "white",
      colTitle: ["买入", "叫买", "价格", "叫卖", "卖出"],
      titleColor: "white",
      rcBgColor: {
        rows: [[0, "black"]],
        cols: [[1, "black"], [3, "black"]],
        cells: [],
      },
      curPColor: "green",
      askPColor: "blue",
      bidPColor: "red",
      curPCol: 2,
      bidPCol: 1,
      askPCol: 3,
      hasTitle: true,
      itemContent: [],
    }
    this.touchPoint = {
      singlePre: {
        area: null,
        identifier: null,
        clientX: 0,
        clientY: 0,
        touchStartT: 0,
      },
      distanceX: 0,
    }

    // kline and order object
    this.kLine = null
    this.orderView = null

    // data array for k line and order scrollview
    this.kData = []
    this.oData = []

    // the data index will be showed in this.kData
    this.kLineStartIndex = 0
    this.kLineEndIndex = 0

    this.isKLineDraged = false

    // the data index will be showed in this.oData
    this.orderStartIndex = 0
    this.orderEndIndex = 0

    this.tickData = []
    this.firstOrderScrollRender = true
    this.curTickIndex = -1

    // curPrice/bidPrice/askPrice index in this.oData
    this.curIndex = 0
    this.bidIndex = 0
    this.askIndex = 0

    this.periodSec = 10

    this.posi = {}
    this.balance = 0
    this.floatBalance = 0
    this.defaultQty = 1
    this.balanceColor = "yellow"
    this.balanceFont = "25px serif"
    this.bgColor = "#1C1F27"

    this.initial()
  }

  // init
  initial() {
    this.processSocket()

    //
    wx.getSystemInfo({
      success: info => {
        this.wWidth = info.windowWidth
        this.wHeight = info.windowHeight
        this.optionKLine.edgeBottom = this.wHeight / 2 + 5
        this.optionKLine.height = this.wHeight - this.optionKLine.edgeTop - this.optionKLine.edgeBottom
        this.optionKLine.width = this.wWidth - this.optionKLine.edgeRight - this.optionKLine.edgeLeft
        this.optionOrder.edgeTop = this.wHeight / 2 + 5
        this.optionOrder.height = this.wHeight - this.optionOrder.edgeTop - this.optionOrder.edgeBottom
        this.optionOrder.width = this.wWidth - this.optionOrder.edgeLeft - this.optionOrder.edgeRight
      }
    })

    // background
    this.canvas = wx.createCanvas()
    let sw = this.canvas.width
    let sh = this.canvas.height
    var ctx = this.canvas.getContext('2d')
    this.ctx = ctx
    ctx.fillStyle = this.bgColor
    ctx.fillRect(0, 0, sw, sh)

    // init k-line
    this.kLine = gKline(ctx, this.optionKLine)
    this.kLine.init()

    // init order scroll
    this.orderView = gOrderView(ctx, this.optionOrder)
    this.orderView.init()
    this.orderView.draw()

    this.showBalance()

    wx.onTouchStart(this.touchStart.bind(this))
    wx.onTouchMove(this.touchMove.bind(this))
    wx.onTouchEnd(this.touchEnd.bind(this))
  }

  // touch start
  touchStart(e) {
    if (1 === e.touches.length) {
      let singlePre = this.touchPoint.singlePre
      singlePre.identifier = e.touches[0].identifier
      singlePre.clientX = e.touches[0].clientX
      singlePre.clientY = e.touches[0].clientY
      singlePre.area = this.checkArea(e.touches[0])
      singlePre.touchStartT = + new Date()
    }
  }

  // touch move 
  touchMove(e) {
    let singlePre = this.touchPoint.singlePre
    if (singlePre.area === areaType.other){
      return
    }
    let singleNow = {}
    if (1 === e.touches.length && singlePre.identifier === e.touches[0].identifier) {
      singleNow.identifier = e.touches[0].identifier
      singleNow.clientX = e.touches[0].clientX
      singleNow.clientY = e.touches[0].clientY
      singleNow.area = this.checkArea(e.touches[0])

      /******************************* update kline area *****************************/
      if (singlePre.area === singleNow.area && singlePre.area === areaType.kline) {
        let offsetX = singleNow.clientX - singlePre.clientX
        let offsetUnit = parseInt(offsetX / this.kLine.candleW)
        // drag touch point moved
        if (0 !== offsetUnit) {
          if ((this.kLineStartIndex - offsetUnit) >= 0 && (this.kLineEndIndex - offsetUnit) <= this.kData.length) {
            this.kLineStartIndex -= offsetUnit
            this.kLineEndIndex -= offsetUnit

            // redraw
            let uo = {
              MinMovement: this.contractInfo.MinMovement,
              fixedPoint: this.fixedPoint,
            }
            this.kLine.drawKLine(this.kData.slice(this.kLineStartIndex, this.kLineEndIndex), uo)

            this.isKLineDraged = true

            this.touchPoint.singlePre = chartUtil.deepCopy(singleNow)
          }
        }
      /******************************* update order area *****************************/
      } else if (singlePre.area === singleNow.area && (singlePre.area === areaType.order || singlePre.area === areaType.buy || singlePre.area === areaType.sell)) {
        let offsetY = singleNow.clientY - singlePre.clientY
        let offsetUnit = parseInt(offsetY / this.orderView.rowH)
        if (0 !== offsetUnit) {
          if ((this.orderEndIndex - offsetUnit) <= this.oData.length && (this.orderStartIndex - offsetUnit) >= 0) {
            this.orderStartIndex -= offsetUnit
            this.orderEndIndex -= offsetUnit

            // reconstruct itemContent
            this.orderView.itemContent.splice(0, this.orderView.itemContent.length)
            let curTickData = this.tickData[this.curTickIndex - 1]
            for(let i=this.orderStartIndex; i<this.orderEndIndex; i++){
              this.orderView.itemContent.push([i-this.orderStartIndex+1, this.optionOrder.curPCol, this.oData[i]])
              if(i === this.bidIndex){
                this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.bidPCol, curTickData.BidQty])
                this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.askPCol, ''])
              } else if(i === this.askIndex){
                this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.askPCol, curTickData.AskQty])
                this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.bidPCol, ''])
              } else {
                this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.bidPCol, ''])
                this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.askPCol, ''])
              }
            }
            this.orderView.drawItem({
              curIndex: this.curIndex - this.orderStartIndex + 1,
              bidIndex: this.bidIndex - this.orderStartIndex + 1,
              askIndex: this.askIndex - this.orderStartIndex + 1,
            })

            this.touchPoint.singlePre = chartUtil.deepCopy(singleNow)
          }
        }
      } else {}
      
    }
  }

  // touch end
  touchEnd (e) {
    let t = + new Date()
    if(1 === e.changedTouches.length){
      let point = e.changedTouches[0]
      if(point.identifier === this.touchPoint.singlePre.identifier){
        if(t - this.touchPoint.singlePre.touchStartT <= 350){
          if(this.touchPoint.singlePre.area === areaType.buy){
            this.buyTap()
          } else if(this.touchPoint.singlePre.area === areaType.sell){
            this.sellTap()
          }              
        }
      }
    }
  }

  // check touch point position
  checkArea(point) {
    let kStartX = this.kLine.edgeLeft + this.kLine.paddingLeft
    let kEndX = kStartX + this.kLine.innerW
    let kStartY = this.kLine.edgeTop + this.kLine.paddingTop
    let kEndY = kStartY + this.kLine.innerH
    let oStartX = this.orderView.edgeLeft
    let oEndX = oStartX + this.orderView.width
    let oStartY = this.orderView.edgeTop + (this.orderView.hasTitle ? this.orderView.rowH : 0)
    let oEndY = oStartY + this.orderView.height - (this.orderView.hasTitle ? this.orderView.rowH : 0)
    let bStartX = this.orderView.edgeLeft
    let bEndX = bStartX + this.orderView.colW
    let bStartY = this.orderView.edgeTop + this.orderView.rowH
    let bEndY = bStartY + this.orderView.height - this.orderView.rowH
    let sStartX = this.orderView.edgeLeft + 4 * this.orderView.colW
    let sEndX = sStartX + this.orderView.colW
    let sStartY = bStartY
    let sEndY = bEndY
    if (point.clientX > kStartX && point.clientX < kEndX && point.clientY > kStartY && point.clientY < kEndY) {
      return areaType.kline
    } else if (point.clientX > bStartX && point.clientX < bEndX && point.clientY > bStartY && point.clientY < bEndY) {
      return areaType.buy
    } else if (point.clientX > sStartX && point.clientX < sEndX && point.clientY > sStartY && point.clientY < sEndY) {
      return areaType.sell
    } else if (point.clientX > oStartX && point.clientX < oEndX && point.clientY > oStartY && point.clientY < oEndY) {
      return areaType.order
    } else {
      return 'other'
    }
  }

  // connect
  connectSocket() {
    this.socket = wx.connectSocket({
      url: "ws://10.3.3.120:19003",
      //url: "ws://10.3.88.100:19003",
      fail: () => {
        console.log('send fail')
        this.connectSocket()
      },
    })
  }

  // process socket
  processSocket() {
    wx.onSocketError(function(e){
      console.log("SocketError: ", e)
    })
    // connect
    this.connectSocket()
    this.socket.onOpen(e => {
      console.log('open socket success')
      this.socket.onMessage(this.dealMessage.bind(this))
      this.socket.onClose(function(e){})
      let data = JSON.stringify({ServiceNo: 1203})
      this.socket.send({
        data: data,
        fail: () => {
          console.log('send fail')
        },
      })
    })
    this.socket.onClose(e => {
      console.log('close socket success')
    })
  }

  // on socket message
  dealMessage(msg) {
    let data = JSON.parse(msg.data)
    switch (data.ServiceNo){
      case 1204:
        // contract info
        this.contractInfo = data.ServiceContent
        console.log(this.contractInfo)
        break
      case 1040:
        // tick line
        if(data.EndFlag){
          if(!this.tickData.length){
            this.tickData.unshift(data.ServiceContent)
          } else if(this.tickData[0].DateTime !== data.ServiceContent.DateTime){ // may be two quot one second, ignore later one
            this.tickData.unshift(data.ServiceContent)
          }
        } else {
          this.generateRowData()
          console.log(this.tickData)
          this.intervalId = setInterval(()=> {
            if(this.tickData.length === this.curTickIndex + 1){
              clearInterval(this.intervalId)
              console.log(this.kData)
            } else {
              this.updateDrawData()
            }
          }, 1000)
          this.socket.close()
        }
        break
      default:
        break
    }
  }

  // update draw data, draw order scorll and k line
  updateDrawData() {
    this.curTickIndex += 1
    this.computeFloatBalance()
    let curTickData = this.tickData[this.curTickIndex]
    /******************************* for order scroll ***************************************/
    this.curIndex = this.oData.indexOf(curTickData.Price.toFixed(this.fixedPoint))
    this.bidIndex = this.oData.indexOf(curTickData.BidPrice.toFixed(this.fixedPoint))
    this.askIndex = this.oData.indexOf(curTickData.AskPrice.toFixed(this.fixedPoint))

    if(this.firstOrderScrollRender){
      // compute start and end index, make maket price center vertically
      let quotient = (this.optionOrder.hasTitle ? this.optionOrder.rowNum - 1 : this.optionOrder.rowNum) / 2
      if(quotient === parseInt(quotient)){
        this.orderStartIndex = this.curIndex - quotient
        this.orderEndIndex = this.curIndex + quotient
      } else {
        quotient = parseInt(quotient)
        this.orderStartIndex = this.curIndex - quotient
        this.orderEndIndex = this.curIndex + quotient + 1
      }
      if (this.orderStartIndex < 0) {
        this.orderEndIndex -= this.orderStartIndex
        this.orderStartIndex = 0
      }
      this.firstOrderScrollRender = false
    }

    // construct itemContent
    this.orderView.itemContent.splice(0, this.orderView.itemContent.length)
    for(let i=this.orderStartIndex; i<this.orderEndIndex; i++){
      this.orderView.itemContent.push([i-this.orderStartIndex+1, this.optionOrder.curPCol, this.oData[i]])
      if(i === this.bidIndex){
        this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.bidPCol, curTickData.BidQty])
        this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.askPCol, ''])
      } else if(i === this.askIndex){
        this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.askPCol, curTickData.AskQty])
        this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.bidPCol, ''])
      } else {
        this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.bidPCol, ''])
        this.orderView.itemContent.push([i - this.orderStartIndex+1, this.optionOrder.askPCol, ''])
      }
    }

    this.orderView.drawItem({
      curIndex: this.curIndex - this.orderStartIndex + 1,
      bidIndex: this.bidIndex - this.orderStartIndex + 1,
      askIndex: this.askIndex - this.orderStartIndex + 1,
    })

    /******************************* for k line ***************************************/
    let candle = {}
    let kLen = this.kData.length
    if(!kLen){
      candle.h = curTickData.Price
      candle.l = curTickData.Price
      candle.o = curTickData.Price
      candle.c = curTickData.Price
      candle.t = this.clipSeconds(curTickData.DateTime)
      this.kData.push(candle)
    } else {
      let lastK = this.kData[kLen - 1]
      let seconds = Math.floor((new Date(curTickData.DateTime) - new Date(lastK.t)) / 1000)
      if(seconds < 10) {
        lastK.h = Math.max(curTickData.Price, lastK.h)
        lastK.l = Math.min(curTickData.Price, lastK.l)
        lastK.c = curTickData.Price
      } else {
        candle.h = curTickData.Price
        candle.l = curTickData.Price
        candle.o = curTickData.Price
        candle.c = curTickData.Price
        candle.t = this.clipSeconds(curTickData.DateTime)
        this.kData.push(candle)
      }
    }
    // only redraw k line when never draged kline
    if (!this.isKLineDraged){
      let len = this.kData.length
      this.kLineEndIndex = len
      this.kLineStartIndex = len > this.optionKLine.unit ? len - this.optionKLine.unit : 0
      let uo = {
        MinMovement: this.contractInfo.MinMovement,
        fixedPoint: this.fixedPoint,
      }
      this.kLine.drawKLine(this.kData.slice(this.kLineStartIndex, this.kLineEndIndex), uo)
    }
  }

  // generate all row data between hight limit and low limit
  generateRowData() {
    let tmp = this.contractInfo.MinMovement.toString().split('.')
    if(tmp.length >= 2){
      this.fixedPoint = tmp[1].length
    } else {
      this.fixedPoint = 0
    }
    let num = (this.tickData[0].HighLimit - this.tickData[0].LowLimit) / this.contractInfo.MinMovement
    for(let i=0; i<=num; i++){
      this.oData.push((this.tickData[0].HighLimit - i * this.contractInfo.MinMovement).toFixed(this.fixedPoint))
    }
  }

  // clip datetime's seconds to integer multiples of periodSec
  clipSeconds(dt) {
    let t = dt.split(' ')
    let dym = t[0].split('-')
    let hms = t[1].split(':')
    t = new Date(dym[0], dym[1]-1, dym[2], hms[0], hms[1], Math.floor(hms[2]/this.periodSec)*this.periodSec)
    return chartUtil.formatDateTime(t.getTime())
  }
  
  // click buy area
  buyTap(){
    if(!this.posi.BS){
      this.posi.BS = BS.buy
      this.posi.qty = this.defaultQty
      this.posi.price = this.tickData[this.curTickIndex].AskPrice
      this.computeFloatBalance()
      wx.showToast({
        title: '买开 ' + this.posi.qty,
        duration: 1000,
        icon: 'none',
      })
    } else if (this.posi.BS === BS.sell) {
      let realQty = this.posi.qty * this.contractInfo.TradeUnit
      this.balance += (this.posi.price - this.tickData[this.curTickIndex].AskPrice) * realQty
      this.floatBalance = 0
      this.posi.BS = undefined
      this.showBalance()
      wx.showToast({
        title: '买平 ' + this.posi.qty,
        duration: 1000,
        icon: 'none',
      })
    } else if(this.posi.BS === BS.buy) {
      wx.showToast({
        title: '请先平买仓',
        duration: 1000,
        icon: 'none',
      })
      return
    }
  }

  // click sell area
  sellTap(){
    if(!this.posi.BS){
      this.posi.BS = BS.sell
      this.posi.qty = this.defaultQty
      this.posi.price = this.tickData[this.curTickIndex].BidPrice
      this.computeFloatBalance()
      wx.showToast({
        title: '卖开 ' + this.posi.qty,
        duration: 1000,
        icon: 'none',
      })
    } else if (this.posi.BS === BS.buy) {
      let realQty = this.posi.qty * this.contractInfo.TradeUnit
      this.balance += (this.tickData[this.curTickIndex].BidPrice - this.posi.price) * realQty
      this.floatBalance = 0
      this.posi.BS = undefined
      this.showBalance()
      wx.showToast({
        title: '卖平 ' + this.posi.qty,
        duration: 1000,
        icon: 'none',
      })
    } else if(this.posi.BS === BS.sell) {
      wx.showToast({
        title: '请先平卖仓',
        duration: 1000,
        icon: 'none',
      })
      return
    }
  }

  // compute float balance
  computeFloatBalance(){
    let qty = this.posi.qty * this.contractInfo.TradeUnit
    if(this.posi.BS === BS.buy){
      this.floatBalance = (this.tickData[this.curTickIndex].BidPrice - this.posi.price) * qty
    } else if(this.posi.BS === BS.sell){
      this.floatBalance = (this.posi.price - this.tickData[this.curTickIndex].AskPrice) * qty
    }
    this.showBalance()
  }

  // show balance
  showBalance(){
    let ctx = this.ctx
    ctx.clearRect(this.edgeLeft, 10, this.canvas.width/2, 30)
    ctx.fillStyle = this.bgColor
    ctx.fillRect(this.edgeLeft, 10, this.canvas.width/2, 30)
    ctx.fillStyle = this.balanceColor
    ctx.font = this.balanceFont
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.fillText((this.balance + this.floatBalance).toFixed(this.fixedPoint), this.edgeLeft, 10)
  }
}


/*
 * k-line
 * Jedore 2018/05/15
 */

module.exports = function (ctx, options) {
  return {
    ctx: ctx,
    unit: options.unit || 50,       //x 轴均分为50个单位
    paddingTop: options.paddingTop || 5,
    paddingBottom: options.paddingBottom || 5,
    paddingLeft: options.paddingLeft || 5,
    paddingRight: options.paddingRight || 5,

    edgeLeft: options.edgeLeft || 50,
    edgeTop:  options.edgeTop || 50,
    edgeRight: options.edgeRight || 50,
    edgeBottom:  options.edgeBottom || 50,

    width: options.width,
    height: options.height,

    bgColor: options.bgColor || "black",
    lineWidth: options.lineWidth || 1.0,
    lineColor: options.lineColor || "gray",

    xLineNum: options.xLineNum|| 4,
    yLineNum: options.yLineNum|| 6,

    txtColor: 'white',
    candleW: 0,
    candleGap: options.candleGap || 2,
    yinInColor: options.yinInColor || '#4cda64',
    yinOutColor: options.yinOutColor || '#4cda64',
    yangInColor: options.yangInColor || 'black',
    yangOutColor: options.yangOutColor || '#ff2f2f',

    showXLine: options.showXLine,
    showYLine: options.showYLine,
    font: options.font || "12px serif",

    dataCandle: {
      openP: [],
      highestP: [],
      lowestP: [],
      closeP: [],
      time: [],
    },

    // some initial operation
    init: function () {
      this.innerH = this.height - this.paddingBottom - this.paddingTop
      this.innerW = this.width - this.paddingLeft - this.paddingRight
      this.candleW = this.innerW / this.unit - this.candleGap

      this.drawBgColor()
      this.drawCoordinate()
      this.drawXLine()
      this.drawYLine()
    },

    // draw background color
    drawBgColor: function(){
      this.ctx.fillStyle = this.bgColor
      let startX = this.edgeLeft
      let startY = this.edgeTop
      this.ctx.fillRect(startX, startY, this.width, this.height)
    },

    // draw coordinate axis
    drawCoordinate: function(){
      let ctx = this.ctx
      ctx.strokeStyle = this.lineColor
      ctx.lineWidth = this.lineWidth
      // y
      let startX = this.edgeLeft + this.paddingLeft
      let endX = startX
      let startY = this.edgeTop + this.paddingTop
      let endY = startY + this.innerH
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(startX, endY)
      ctx.stroke()

      // x
      endX = startX + this.innerW
      startY = endY
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    },

    // draw horizontal except axis
    drawXLine: function(){
      if(!this.showXLine){
        return
      }
      let ctx = this.ctx
      ctx.strokeStyle = this.lineColor
      ctx.lineWidth = this.lineWidth

      let rowH = (this.innerH) / this.xLineNum
      let startX = this.edgeLeft + this.paddingLeft
      let endX = startX + this.innerW
      let startY, endY 
      for(let i=0; i<=this.xLineNum; i++){
        startY = endY = this.edgeTop + this.paddingTop + i * rowH
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
    },

    // draw x axis label
    drawXLabel: function(){
      let ctx = this.ctx
      let x = this.edgeLeft + this.paddingLeft
      let y = this.edgeTop + this.height - this.paddingBottom
      let t = this.dataCandle.time
      ctx.font = this.font
      ctx.fillStyle = this.txtColor
      ctx.textBaseline = "top"
      ctx.textAlign = "left"
      ctx.fillText(t[0], x, y)

      x = this.edgeLeft + this.width - this.paddingRight
      ctx.textAlign = "right"
      ctx.fillText(t[t.length-1], x, y)
    },

    // draw y axis label
    drawYLabel: function(){
      let ctx = this.ctx
      let stepPrice = (this.yMaxPrice - this.yMinPrice) / this.xLineNum
      let stepDistance = this.innerH / this.xLineNum
      let x = this.edgeLeft + this.paddingLeft, y
      ctx.fillStyle = this.txtColor
      ctx.font = this.font
      ctx.textAlign = "left"
      for(let i=0; i<=this.xLineNum; i++){
        y = this.edgeTop + this.paddingTop + i * stepDistance
        if(i < this.xLineNum/2) {
          ctx.textBaseline = "top"
        } else if(i > this.xLineNum/2){
          ctx.textBaseline = "bottom"
        } else {
          ctx.textBaseline = "middle"
        }
        ctx.fillText((this.yMaxPrice - i * stepPrice).toFixed(this.fixedPoint), x, y)
      }
    },

    // draw vertical except axis
    drawYLine: function(){
      if(!this.showYLine){
        return
      }
      let ctx = this.ctx
      ctx.strokeStyle = this.lineColor
      ctx.lineWidth = this.lineWidth

      let colW = (this.innerW) / this.yLineNum
      let startY = this.edgeTop + this.paddingTop
      let endY = startY + this.innerH
      let startX, endX
      for(let i=0; i<=this.yLineNum; i++){
        startX = endX = this.edgeLeft + this.paddingLeft + i * colW
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
    },

    // draw k line
    drawKLine: function(data, updateOption){
      if (updateOption) {
        this.MinMovement = updateOption.MinMovement
        this.fixedPoint = updateOption.fixedPoint
      }

      // clear old canvas and draw background
      this.ctx.clearRect(this.edgeLeft, this.edgeTop, this.width, this.height)
      this.drawBgColor()
      this.drawCoordinate()
      this.drawXLine()
      this.drawYLine()

      // clear old data
      this.dataCandle.time.splice(0, data.length)
      this.dataCandle.openP.splice(0, data.length)
      this.dataCandle.highestP.splice(0, data.length)
      this.dataCandle.lowestP.splice(0, data.length)
      this.dataCandle.closeP.splice(0, data.length)

      this.yMaxPrice = 0
      this.yMinPrice = 10000000

      for(let i=0; i<data.length; i++){
        this.dataCandle.time.push(data[i].t)
        this.dataCandle.openP.push(data[i].o)
        this.dataCandle.closeP.push(data[i].c)
        this.dataCandle.highestP.push(data[i].h)
        this.dataCandle.lowestP.push(data[i].l)

        this.yMaxPrice = Math.max(this.yMaxPrice, data[i].h)
        this.yMinPrice = Math.min(this.yMinPrice, data[i].l)
      }

      // avoid max and min is equal
      if(this.yMaxPrice === this.yMinPrice) {
        this.yMaxPrice += this.MinMovement * 10
        this.yMinPrice -= this.MinMovement * 10
      }

      for(let i=0; i<this.dataCandle.openP.length; i++){
        this.drawCandle(i, this.dataCandle.openP[i], this.dataCandle.highestP[i], this.dataCandle.lowestP[i], this.dataCandle.closeP[i])
      }

      this.drawXLabel()
      this.drawYLabel()
    },

    // draw candle
    drawCandle: function(index, o, h, l, c){
      let ctx = this.ctx
      let inColor = c > o ? this.yangInColor : this.yinInColor 
      let outColor = c > o ? this.yangOutColor : this.yinOutColor 
      ctx.translate(this.edgeLeft + this.paddingLeft, this.edgeTop + this.paddingTop)

      h = this.innerH * (this.yMaxPrice - h) / (this.yMaxPrice - this.yMinPrice)
      l = this.innerH * (this.yMaxPrice - l) / (this.yMaxPrice - this.yMinPrice)
      o = this.innerH * (this.yMaxPrice - o) / (this.yMaxPrice - this.yMinPrice)
      c = this.innerH * (this.yMaxPrice - c) / (this.yMaxPrice - this.yMinPrice)

      let lineH = l - h
      let cStartX = this.candleGap +  index * (this.candleW + this.candleGap)
      let cEndX = cStartX + this.candleW
      let cMiddleX = (cStartX + cEndX) / 2
      // draw shadow line
      let cStartY = h
      let cEndY = cStartY + lineH
      ctx.strokeStyle = outColor
      ctx.beginPath()
      ctx.moveTo(cMiddleX, cStartY)
      ctx.lineTo(cMiddleX, cEndY)
      ctx.stroke()

      //draw entity
      let barH = Math.abs(c - o)
      if(barH){
        ctx.lineWidth = this.lineWidth
        ctx.strokeStyle = outColor
        ctx.strokeRect(cStartX, c < o ? c : o, this.candleW, barH)
        let x = cStartX + this.lineWidth / 2
        let y = (c < o ? c : o) + this.lineWidth / 2
        let xw = this.candleW - 1 * this.lineWidth
        let yh = barH - 1 * this.lineWidth
        ctx.fillStyle = inColor 
        ctx.fillRect(x, y, xw, yh)
      } else {
        ctx.fillStyle = outColor
        ctx.fillRect(cStartX, c, this.candleW, 1)
      }

      ctx.translate(- this.edgeLeft - this.paddingLeft, - this.edgeTop - this.paddingTop)
    },
  };
};

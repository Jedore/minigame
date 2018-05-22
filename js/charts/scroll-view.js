/**
 * Scroll view plugin
 * Jedore
 * 2018/05/10
 *
 *
 * rcBgColor: background color
 *    format: 
 *          {
 *            rows: [[rowNo, color], ...],
 *            cols: [[colNo, color], ...],
 *            cells: [[rowNo, colNo, color], ...],
 *          }
 *  itemContent:
 *    format: [
 *              [rowNo, colNo, content], ...
 *            ]
 *
 *  rowNo: from 0 to rowNum-1
 *  colNo: from 0 to colNum-1 (do not think of title)
 *
 *  Think of linewidth, some code do relative deal.
 */

var chartUtil = require('./utils.js')

module.exports = function(ctx, options) {
  return {
    ctx: ctx || null,
    bgColor: options.bgColor || "gray",
    rowNum: options.rowNum,
    colNum: options.colNum,
    rowH: options.rowH,
    colW: options.colW,
    edgeLeft: options.edgeLeft,
    edgeTop: options.edgeTop,
    edgeRight: options.edgeRight,
    edgeBottom: options.edgeBottom,
    width: options.width,
    height: options.height,
    lineColor: options.lineColor || "black",
    lineWidth: options.lineWidth || 1.0,
    colTitle: options.colTitle || [],
    rcBgColor: chartUtil.deepCopy(options.rcBgColor) || {rows: [], cols: []},
    curPColor: options.curPColor || "yellow",
    askPColor: options.askPColor || "yellow",
    bidPColor: options.bidPColor || "yellow",
    curPCol: options.curPCol,
    askPCol: options.askPCol,
    bidPCol: options.bidPCol,
    titleColor: options.titleColor || "white",
    titleFont: options.titleFont || "15px serif",
    hasTitle: options.hasTitle || true,
    itemContent: options.itemContent || [],
    itemFont: options.itemFont || "15px serif",
    itemColor: options.itemColor || "white",

    // some init operation
    init: function() {
      this.rowH = (this.height - this.lineWidth * (this.rowNum + 1)) / this.rowNum
      this.colW = (this.width - this.lineWidth * (this.colNum + 1)) / this.colNum
    },

    // draw horizontal
    drawXLine: function(){
      let ctx = this.ctx
      ctx.strokeStyle = this.lineColor
      ctx.lineWidth = this.lineWidth

      ctx.translate(this.edgeLeft, this.edgeTop)

      let startX = this.lineWidth
      let endX = this.width - 2 * this.lineWidth;
      let startY, endY
      for(let i=0; i < this.rowNum+1; i++) {
        startY = i * (this.rowH + this.lineWidth)
        endY = startY
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      ctx.translate(- this.edgeLeft, - this.edgeTop)
    },

    // draw vertical
    drawYLine: function() {
      let ctx = this.ctx
      ctx.strokeStyle = this.lineColor
      ctx.lineWidth = this.lineWidth

      ctx.translate(this.edgeLeft, this.edgeTop)

      let startY = 0
      let endY = startY + this.height
      let startX = 0
      let endX = 0
      for(let i=0; i < this.colNum+1; i++) {
        startX = i * (this.colW + this.lineWidth)
        endX = startX
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }

      ctx.translate(- this.edgeLeft, - this.edgeTop)
    },

    // draw column title
    drawColTitle: function() {
      let ctx = this.ctx
      ctx.font = this.titleFont
      ctx.fillStyle = this.titleColor 
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      ctx.translate(this.edgeLeft + this.lineWidth, this.edgeTop + this.lineWidth)

      let startX = 0
      let startY = this.rowH / 2
      for(let i=0; i<this.colTitle.length; i++) {
        startX = i * (this.colW + this.lineWidth) + this.colW / 2
        ctx.fillText(this.colTitle[i], startX, startY)
      }
      ctx.translate(- this.edgeLeft - this.lineWidth, - this.edgeTop - this.lineWidth)
    },

    // draw background color
    drawBgColor: function() {
      let startX, startY, w, h
      let ctx = this.ctx
      // for background
      ctx.fillStyle = this.bgColor
      ctx.fillRect(this.edgeLeft, this.edgeTop, this.width, this.height)
      
      ctx.translate(this.edgeLeft + this.lineWidth, this.edgeTop + this.lineWidth)

      // for column
      for(let i=0; i<this.rcBgColor.cols.length; i++) {
        startX = this.rcBgColor.cols[i][0] * (this.colW + this.lineWidth)
        startY = this.hasTitle ? (this.rowH + this.lineWidth) : 0
        w = this.colW
        h = this.height - 3 * this.lineWidth - (this.hasTitle ? (this.rowH + this.lineWidth) : 0)
        ctx.fillStyle = this.rcBgColor.cols[i][1]
        ctx.fillRect(startX, startY, w, h)
      }
      // for row
      for(let i=0; i<this.rcBgColor.rows.length; i++) {
        startX = 0
        startY = this.rcBgColor.rows[i][0] * (this.rowH + this.lineWidth)
        w = this.width - 3 * this.lineWidth
        h = this.rowH - this.lineWidth
        ctx.fillStyle = this.rcBgColor.rows[i][1]
        ctx.fillRect(startX, startY, w, h)
      }

      // for cell
      for(let i=0; i<this.rcBgColor.cells.length; i++){
        startX = this.rcBgColor.cells[i][1] * (this.colW + this.lineWidth)
        startY = this.rcBgColor.cells[i][0] * (this.rowH + this.lineWidth)
        w = this.colW - this.lineWidth
        h = this.rowH - this.lineWidth
        ctx.fillStyle = this.rcBgColor.cells[i][2]
        ctx.fillRect(startX, startY, w, h)
      }

      ctx.translate(- this.edgeLeft - this.lineWidth, - this.edgeTop - this.lineWidth)
    },

      // merge cell
    mergeCell: function(){
      let ctx = this.ctx
      ctx.translate(this.edgeLeft + this.lineWidth, this.edgeTop + this.lineWidth)

      ctx.fillStyle = this.bgColor
      let startX = 0
      let startY = this.rowH + this.lineWidth
      ctx.fillRect(startX, startY, this.colW - this.lineWidth / 2, this.height - this.rowH - 4 * this.lineWidth)

      startX = this.width - this.colW - 2.5 * this.lineWidth
      startY = this.rowH + this.lineWidth
      ctx.fillRect(startX, startY, this.colW - this.lineWidth / 2, this.height - this.rowH - 4 * this.lineWidth)

      ctx.translate(- this.edgeLeft - this.lineWidth, - this.edgeTop - this.lineWidth)
    },

    // draw item content
    drawItem: function(index) {
      let itemContent = this.itemContent
      let startX, startY, w, h
      let ctx = this.ctx
      ctx.translate(this.edgeLeft + this.lineWidth, this.edgeTop + this.lineWidth)

      // draw item bg color and text
      for(let i=0; i<itemContent.length; i++) {
        if(itemContent[i][0] <= 0 || itemContent[i][0] >= this.rowNum) {
          continue
        }
        startX = itemContent[i][1] * (this.colW + this.lineWidth)
        startY = itemContent[i][0] * (this.rowH + this.lineWidth)
        w = this.colW - this.lineWidth
        h = this.rowH - this.lineWidth

        let itemBgColor = this.selectBgColor(itemContent[i][0], itemContent[i][1])
        if(itemContent[i][0] === index.curIndex && itemContent[i][1] === this.curPCol) {
          itemBgColor = this.curPColor
        } else if(itemContent[i][0] === index.bidIndex && itemContent[i][1] === this.bidPCol) {
          itemBgColor = this.bidPColor
        } else if(itemContent[i][0] === index.askIndex && itemContent[i][1] === this.askPCol) {
          itemBgColor = this.askPColor
        }
        this.drawCell(startX, startY, w, h, itemContent[i][2], itemBgColor)
      }
      ctx.translate(- this.edgeLeft - this.lineWidth, - this.edgeTop - this.lineWidth)
    },

    // draw cell
    drawCell: function(x, y, w, h, text, color){
      ctx.fillStyle = color
      ctx.fillRect(x, y, w, h)

      ctx.font = this.itemFont
      ctx.fillStyle = this.itemColor 
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(text, x + this.colW / 2, y + this.rowH / 2)
    },

    // select bg color
    selectBgColor: function(rowNo, colNo){
      let itemBgColor
      // traverse cell color
      if(!itemBgColor) {
        for(let j=0; j<this.rcBgColor.cells.length; j++){
          if(this.rcBgColor.cells[j][0] === rowNo && this.rcBgColor.cells[j][1] === colNo) {
            itemBgColor = this.rcBgColor.cols[j][1]
          }
        }
      }
      // traverse row  color
      if(!itemBgColor) {
        for(let l=0; l<this.rcBgColor.rows.length; l++){
          if(this.rcBgColor.rows[l][0] === rowNo) {
            itemBgColor = this.rcBgColor.rows[l][1]
          }
        }
      }
      // traverse col color
      if(!itemBgColor) {
        for(let k=0; k<this.rcBgColor.cols.length; k++){
          if(this.rcBgColor.cols[k][0] === colNo) {
            itemBgColor = this.rcBgColor.cols[k][1]
          }
        }
      }
      if(!itemBgColor) {
        itemBgColor = this.bgColor
      }
      return itemBgColor
    },

    draw: function() {
      this.drawBgColor()
      this.drawXLine()
      this.drawYLine()
      this.drawColTitle()
      this.mergeCell()
    },
  };
}

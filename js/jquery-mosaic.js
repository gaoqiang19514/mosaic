var lg          = console.log;




function Mosaic($item, $mosaicContainer){

    this.$item      = $item;
    this.$container = $mosaicContainer;
    this.$items     = $mosaicContainer.find('.mosaic__item');


    this.brushHalf  = 10;
    var SCALEOFFSET = 10;

    this.drawSteps  = [];

    this.target     = 'body';
    this.template   = $('#J_mosaic_workspace_template').text();

    this.init();
}

Mosaic.prototype.init = function(){
    this.buildHtml();
    this.bindEvents();
};

Mosaic.prototype.buildHtml = function(){
    var that = this;

    var $template = $(that.template);

    that.$content = $template.find('.mosaic-workspace-content');
    that.$canvas  = $template.find('.mosaic-workspace-canvas');
    that.$close   = $template.find('.mosaic-workspace-close');
    that.$back    = $template.find('.mosaic-workspace-back-btn');

    that.canvas   = that.$canvas[0];
    that.context  = that.canvas.getContext('2d');
    that.canvasW  = 0;
    that.canvasH  = 0;

    
    var src = that.$item.find('.mosaic__img').attr('src');
    
    var promise = new Promise(function(resolve, reject){

        that.getImageSize(src, function(data){
            that.$canvas
                .css({
                    width: data.width,
                    height: data.height
                })
                .attr({
                    'width': data.width,
                    'height': data.height
                });

            that.$content.css({
                width: data.width,
                height: data.height
            });

            that.canvasW  = that.$canvas.width();
            that.canvasH  = that.$canvas.height();

            resolve(data);
        });

    });

    promise.then(function(data){
        that.img = data.img
        var context = that.$canvas[0].getContext('2d');
        context.drawImage(data.img, 0, 0);

        that.$workspace = $template.appendTo(that.target);
    });

};

Mosaic.prototype.bindEvents = function(){
    var that = this;

    // 关闭工作台
    that.$close.on('click', function(e){
        that.$workspace.remove();
    });

    that.resetDrag();
    
    that.$content.on('mousedown', function(e){
        // 阻止back btn 执行了content上的mousedown
        var $target = $(e.target);
        if($target.closest('.mosaic-workspace-back-btn').length){return;}

        step        = [];
        that.isDrag = true;
        that.start  = { x:  e.clientX, y: e.clientY };
    });

    var step   = [];
    var offset = {x: 0, y: 0};
    var left   = 0, top = 0;
    $(document).on('mousemove', function(e){
        if(!that.isDrag){return;}

        that.moving = {
            x: e.clientX - that.start.x + that.last.x,
            y: e.clientY - that.start.y + that.last.y
        };

        offset = that.$content.offset();
        left = e.clientX - offset.left;
        top = e.clientY - offset.top;

        that.drawCoordinateLine(e.clientX, e.clientY);

        var func = (function(_left, _top){
            return function(){
                that.drawMosaic(that.canvas, _left, _top);
            };
        })(left, top);

        // var func = function(){
        //     that.drawMosaic(that.canvas, left, top);
        // };

        step.push(func);

        func();

        return false;
    });
    
    $(document).on('mouseup', function(e){
        if(that.isDrag){
            that.isDrag = false;
            that.last = {
                x: that.moving.x,
                y: that.moving.y
            };

            that.drawSteps.push(step);
            that.clearCoordinateLine();
        }
    });

    that.$back.on('click', function(e){
        that.redraw();
        return false;
    });
};

Mosaic.prototype.clearCanvas = function(){
    this.context.clearRect(0, 0, this.canvasW, this.canvasH);  
};

Mosaic.prototype.redraw = function(){
    var that = this;

    that.clearCanvas();
    that.context.drawImage(that.img, 0, 0);

    that.drawSteps.pop();

    $.each(that.drawSteps, function(){
        $.each(this, function(){
            
            this();
        })
    });
};

Mosaic.prototype.drawCoordinateLine = function(x, y){
    var that = this;

    if(!that.$coordinateLine){
        that.$coordinateLine = $('<div class="coordinate-line"><div class="coordinate-line-x"></div><div class="coordinate-line-y"></div></div>');
        that.$coordinateLineX = that.$coordinateLine.find('.coordinate-line-x');
        that.$coordinateLineY = that.$coordinateLine.find('.coordinate-line-y');
        that.$coordinateLine.appendTo('body');
    }
    that.$coordinateLineX.css({
        left: x
    });
    that.$coordinateLineY.css({
        top: y
    });
};

Mosaic.prototype.clearCoordinateLine = function(x, y){
    if(this.$coordinateLine){
        this.$coordinateLine.remove();
        this.$coordinateLine = null;
    }
};

Mosaic.prototype.resetDrag = function(sizeData){
    this.isDrag = false;
    this.start  = {x: 0, y: 0};
    this.moving = {x: 0, y: 0};
    this.last   = {x: 0, y: 0};
};

Mosaic.prototype.getImageSize = function(src, onload){
    var img = new Image;

    img.onload = function(e){
        onload &&　onload({
            img: this,
            width: this.naturalWidth,
            height: this.naturalHeight
        });
    };

    img.src = src;
};

// 找到坐标点基于画布的区域坐标
Mosaic.prototype.getAveragePos = function(canvas, x, y, width, height){
    var i = 1, j = 1, left = 0, right = 0, top = 0, bottom = 0;
    var wLen = canvas.width / width;
    var hLen = canvas.height / height;

    for(; i <= wLen; i++){
        left  = i * width - width;
        right = i * width;

        if(x >= left && x <= right){break;}
    }

    for(; j <= hLen; j++){
        top    = j * height - height;
        bottom = j * height;

        if(y >= top && y <= bottom){break;}
    }

    return {
        x: (i - 1) * width,
        y: (j - 1) * height
    }
};

Mosaic.prototype.drawMosaic = function(canvas, x, y){

    var r = 0, g = 0, b = 0, a = 0;
    var width   = this.brushHalf * 2;
    var height  = this.brushHalf * 2;
    var pos     = this.getAveragePos(canvas, x, y, width, height);

    var context = canvas.getContext('2d');
    var imgData = context.getImageData(pos.x, pos.y, width, height);

    var data = imgData.data;

    // 累加imageData的rgba色值
    var i = 0;
    for(; i < data.length; i += 4){
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        a += data[i + 3];
    }

    // 计算区域平均rgba数值 然后创建一个imageData对象 将计算的平均色值赋值给它
    r /= data.length / 4;
    g /= data.length / 4;
    b /= data.length / 4;
    a /= data.length / 4;

    var newImgData = context.createImageData(width, height);
    var j = 0;
    for(; j < data.length; j += 4){
        newImgData.data[j] 	   = r;
        newImgData.data[j + 1] = g;
        newImgData.data[j + 2] = b;
        newImgData.data[j + 3] = a;
    }

    context.putImageData(newImgData, pos.x, pos.y);
};



var initMosaicFromDOM = function(mosaicContainerSelector){

    var onThumbnailsClick = function(e){
        var $target = $(e.target);

        var $clickedListItem = $target.closest('.mosaic__item');

        if(!$clickedListItem.length){return;}

        var $clickedParent = $clickedListItem.parent();

        openWorkspace($clickedListItem, $clickedParent);
    };

    var openWorkspace = function($item, $mosaicContainer){
        new Mosaic($item, $mosaicContainer);
    };

    var mosaicElements = $(mosaicContainerSelector);

    for (var i = 0, l = mosaicElements.length; i < l; i++) {
        mosaicElements[i].onclick = onThumbnailsClick;
    }
};


initMosaicFromDOM('.mosaic-container');









		
// 操作每步绘制操作 有两种选择 字符串形式 函数形式
var drawHistory = [];

var pressd      = false;
var imageWidth  = 150;
var imageHeight = 100;
var brushHalf   = 10;
var SCALEOFFSET = 10;

// 找到坐标点基于画布的区域坐标
function getAveragePos(canvas, x, y, width, height){
    var i = 1, j = 1, left = 0, right = 0, top = 0, bottom = 0;
    var wLen = canvas.width / width;
    var hLen = canvas.height / height;

    for(; i <= wLen; i++){
        left  = i * width - width;
        right = i * width;

        if(x >= left && x <= right){break;}
    }

    for(; j <= hLen; j++){
        top    = j * height - height;
        bottom = j * height;

        if(y >= top && y <= bottom){break;}
    }

    return {
        x: (i - 1) * width,
        y: (j - 1) * height
    }
}

// 根据在x y的坐标上绘制马赛克
function drawMosaic(canvas, x, y){
    var r = 0, g = 0, b = 0, a = 0;
    var width   = brushHalf * 2;
    var height  = brushHalf * 2;
    var pos     = getAveragePos(canvas, x, y, width, height);
    
    var context = canvas.getContext('2d');
    var imgData = context.getImageData(pos.x, pos.y, width, height);

    var data = imgData.data;

    // 累加imageData的rgba色值
    var i = 0;
    for(; i < data.length; i += 4){
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        a += data[i + 3];
    }

    // 计算区域平均rgba数值 然后创建一个imageData对象 将计算的平均色值赋值给它
    r /= data.length / 4;
    g /= data.length / 4;
    b /= data.length / 4;
    a /= data.length / 4;

    var newImgData = context.createImageData(width, height);
    var j = 0;
    for(; j < data.length; j += 4){
        newImgData.data[j] 	   = r;
        newImgData.data[j + 1] = g;
        newImgData.data[j + 2] = b;
        newImgData.data[j + 3] = a;
    }

    context.putImageData(newImgData, pos.x, pos.y);
}

// 获取图片的缩放尺寸
function getCompressSize(naturalWidth, naturalHeight, winW, winH){
    var scale = Math.min(winW / naturalWidth, winH / naturalHeight, 1) / 1.1;

    return {
        w: parseInt(naturalWidth * scale),
        h: parseInt(naturalHeight * scale),
    };
}

// 获取图片的缩放比例
function getScale(naturalWidth, width){

    return naturalWidth / width || 1;
}

// 生成预览区域到wrap中
function createScaleArea(canvas, $wrap, x, y){
    var $canvas = $('.scale-area');
    if(!$canvas.length){
        $canvas = $('<canvas class="scale-area"></canvas>');
        $wrap.append($canvas);
    }

    $canvas.attr({
        'width': imageWidth,
        'height': imageHeight
    });

    $canvas.css({
        left: x,
        top: y,
        width: imageWidth,
        height: imageHeight
    });
}

// 绘制预览区域
function drawScaleArea(canvas, x, y){
    var context = $('.scale-area')[0].getContext('2d');

    context.clearRect(0, 0, imageWidth, imageHeight);
    context.drawImage(canvas, x - imageWidth / 2, y - imageHeight / 2, imageWidth, imageHeight, 0, 0, imageWidth, imageHeight);
}

var clearCanvas = function clearCanvas(canvas, width, height){
    var context = canvas.getContext("2d");  
    context.clearRect(0 ,0, width, height);  
}

// 生成弹层 处理马赛克操作
function createWorkSpace(img, width, height){
    var left 	 = 0, 
        top      = 0,
        $win     = $(window),
        $canvas  = $('<canvas></canvas>'),
        $layer   = $('<div class="layer"><button class="back">撤销</button></div>'),
        $wrap    = $('<div class="layer__wrap"></div>');
    
    var $backBtn = $layer.find('.back');

    var compress = getCompressSize(width, height, $win.width(), $win.height());
    var scale    = getScale(width, compress.w);

    var context  = $canvas[0].getContext('2d');

    $canvas.attr({
        'width': width,
        'height': height
    });
    $canvas.css({
        width: compress.w,
        height: compress.h
    });

    // 将传入的img对象绘制到弹层的canvas上
    context.drawImage(img, 0, 0);

    $wrap.css({
        width:  	compress.w,
        height: 	compress.h,
        marginLeft: -parseInt(compress.w / 2),
        marginTop:  -parseInt(compress.h / 2)
    });

    var newHistory;
    
    // 撤销按钮，从历史记录中删除最后个记录，然后遍历执行
    $backBtn.on('click', function(e){
        drawHistory.pop();

        // 清空画布
        
        clearCanvas($canvas[0], width, height);
        context.drawImage(img, 0, 0);

        // 怎么执行drawHistory中的记录呢？
        for(var i = 0; i < drawHistory.length; i++){
            for(var j = 0; j < drawHistory[i].length; j++){
                lg(drawHistory[i][j]);

                drawMosaic(drawHistory[i][j].canvas, drawHistory[i][j].left, drawHistory[i][j].top);
                
            }
        }

        return false;
    });
    
    
    // 鼠标按下
    $canvas.on('mousedown', function(e){
        pressd = true;

        newHistory = [];
        
        left = parseInt((e.clientX - $canvas.offset().left) * scale);
        top  = parseInt((e.clientY - $canvas.offset().top) * scale);

        // 根据left top给预览区定位
        var scaleAreaLeft = compress.w - imageWidth;
        var scaleAreaTop = 0;

        var offsetLeft = e.clientX - $canvas.offset().left;
        var offsetTop = e.clientY - $canvas.offset().top;

        if(offsetLeft + SCALEOFFSET >= (compress.w - imageWidth - 0)){
            scaleAreaLeft = 0;
        }

        // 生成预览
        createScaleArea(this, $wrap, scaleAreaLeft, scaleAreaTop);

        // 实时将鼠标的move位置沪指导缩放区域
        drawScaleArea(this, left, top);
        drawMosaic(this, left, top);


        newHistory.push({
            canvas: this,
            left: left,
            top: top					
        });
    });
    
    // 鼠标按下同时开始移动 也就是绘制操作
    $canvas.on('mousemove', function(e){
        if(!pressd){return;}
        
        left = (e.clientX - $canvas.offset().left) * scale;
        top  = (e.clientY - $canvas.offset().top) * scale;

        var scaleAreaLeft = compress.w - imageWidth;
        var scaleAreaTop = 0;

        var offsetLeft = e.clientX - $canvas.offset().left;
        var offsetTop = e.clientY - $canvas.offset().top;

        if(offsetLeft + SCALEOFFSET >= (compress.w - imageWidth)){
            scaleAreaLeft = 0;
        }

        createScaleArea(this, $wrap, scaleAreaLeft, scaleAreaTop);

        // 实时将鼠标的move位置沪指导缩放区域	
        drawScaleArea(this, left, top);
        drawMosaic(this, left, top);

        newHistory.push({
            canvas: this,
            left: left,
            top: top					
        });
    });
    
    // 鼠标抬起 本次绘制结束
    $canvas.on('mouseup', function(e){
        pressd = false;
        $wrap.find('.scale-area').remove();

        drawHistory.push(newHistory);
        console.log(drawHistory)
    });

    // 关闭工作弹层
    $layer.on('click', function(e){
        if($(e.target).closest($wrap).length){return;}
        $layer.remove();

        drawHistory = [];
    });

    $layer.append($wrap.html($canvas)).appendTo('body');


}

// 给图片容器内部添加一个编辑按钮 用来触发工作弹层的开关
$('.box').append('<button class="edit">编辑</button>');
$('.box').on('click', '.edit', function(e){
    var img = $(this).parent('.box').find('img')[0];

    // 传入需要处理的源图片尺寸信息
    createWorkSpace(img, img.naturalWidth, img.naturalHeight);
});
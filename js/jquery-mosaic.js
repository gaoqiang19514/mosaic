var lg          = console.log;




function Mosaic($container){

    this.$container = $container;
    this.$items = $container.find('.mosaic__item');
    
    this.init();
}

Mosaic.prototype.init = function(){
    this.buildHtml();
    this.bindEvents();
};


Mosaic.prototype.buildHtml = function(){

    this.$container.on('mouseenter', '.mosaic__item', this.showEditButton);
    this.$container.on('mouseleave', '.mosaic__item', this.hideEditButton);

    this.$container.on('click', '.mosaic__button--edit', this.openWorkspace);

};



Mosaic.prototype.showEditButton = function(e){
    $(this).find('.mosaic__button').addClass('mosaic__button--active');

};

Mosaic.prototype.hideEditButton = function(e){
    $(this).find('.mosaic__button').removeClass('mosaic__button--active');
};

Mosaic.prototype.openWorkspace = function(e){
    

};
    
Mosaic.prototype.bindEvents = function(){

};


new Mosaic($('.mosaic-container'));














		
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
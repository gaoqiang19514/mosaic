var lg          = console.log;


var commandStack = [];
var makeCommand = function(func){
    return function(){
        func();
    };
};


function Mosaic($item, $mosaicContainer){

    this.$item      = $item;
    this.$container = $mosaicContainer;
    this.$items     = $mosaicContainer.find('.mosaic__item');

    this.brushHalf  = 10;

    this.commandStack = [];

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

    that.$win   = $(window);
    var $template = $(that.template);

    that.$content = $template.find('.mosaic-workspace-content');
    that.$canvas  = $template.find('.mosaic-workspace-canvas');
    that.$close   = $template.find('.mosaic-workspace-close');
    that.$back    = $template.find('.mosaic-workspace-back-btn');

    that.canvas   = that.$canvas[0];
    that.context  = that.canvas.getContext('2d');
    that.canvasW  = 0;
    that.canvasH  = 0;
    that.winW     = that.$win.width();
    that.winH     = that.$win.height();
    that.naturalW = 0;
    that.naturalH = 0;
    
    var src = that.$item.find('.mosaic__img').attr('src');
    
    var promise = new Promise(function(resolve, reject){

        that.getImageSize(src, function(data){

            that.canvasW = that.naturalW = data.width;
            that.canvasH = that.naturalH = data.height;

            var compress = that.compress = that.getCompressSize(data.width, data.height);

            that.$canvas
                .css({
                    width: compress.width,
                    height: compress.height
                })
                .attr({
                    'width': that.naturalW,
                    'height': that.naturalH
                });

            that.$content.css({
                width: compress.width,
                height: compress.height
            });

            resolve(data);
        });

    });

    promise.then(function(data){
        that.img = data.img

        that.context.drawImage(data.img, 0, 0);

        that.$workspace = $template.appendTo(that.target);
    });

};

// 找到坐标点基于画布的区域坐标
Mosaic.prototype.getAveragePos = function(x, y, width, height){
    var i = 1, j = 1, left = 0, right = 0, top = 0, bottom = 0;
    var wLen = this.canvas.width / width;
    var hLen = this.canvas.height / height;

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

Mosaic.prototype.drawMosaic = function(x, y){
    var r = 0, g = 0, b = 0, a = 0;
    var width   = this.brushHalf * 2;
    var height  = this.brushHalf * 2;
    var pos     = this.getAveragePos(x, y, width, height);

    var imgData = this.context.getImageData(pos.x, pos.y, width, height);

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

    var newImgData = this.context.createImageData(width, height);
    var j = 0;
    for(; j < data.length; j += 4){
        newImgData.data[j] 	   = r;
        newImgData.data[j + 1] = g;
        newImgData.data[j + 2] = b;
        newImgData.data[j + 3] = a;
    }

    this.context.putImageData(newImgData, pos.x, pos.y);
};

Mosaic.prototype.bindEvents = function(){
    var that = this;

    var 
        command = null,
        commandList = [],
        left   = 0, 
        top    = 0, 
        scrollTop = 0,
        offset = { x: 0, y: 0 };

    that.$content.on('mousedown', function(e){
        var $target = $(e.target);
        if($target.closest('.mosaic-workspace-back-btn').length){return;}

        that.isDrag = true;
        
        offset    = that.$content.offset();
        scrollTop = $(window).scrollTop();

        // 创建命令 执行命令 将命令入栈
        commandList = [];
        command = makeCommand(function(){
            that.drawMosaic((e.clientX - offset.left) / that.scale, (e.clientY - offset.top) / that.scale);
        });
        command();
        commandList.push(command);

        that.createCoordinateLine(e.clientX, e.clientY);
    });

    $(document).on('mousemove', function(e){
        if(!that.isDrag){return;}

        offset    = that.$content.offset();
        scrollTop = $(window).scrollTop();


        // 创建命令 执行命令 将命令入栈
        command = makeCommand(function(){
            that.drawMosaic((e.clientX - offset.left) / that.scale, (e.clientY - offset.top + scrollTop) / that.scale);
        });
        command();
        commandList.push(command);

        that.drawCoordinateLine(e.clientX, e.clientY);

        return false;
    });
    
    $(document).on('mouseup', function(e){
        if(that.isDrag){
            that.isDrag = false;
            
            // 压入命令栈
            that.commandStack.push(commandList);

            that.clearCoordinateLine();
        }
    });

    that.$back.on('click', function(e){
        that.redraw();
        return false;
    });

    // 关闭工作台
    that.$close.on('click', function(e){
        that.$workspace.remove();
    });
};

// 回到上一步
Mosaic.prototype.redraw = function(){
    var that = this;

    if(!that.commandStack.length){
        alert('没有可以撤回的了');
        return;
    }

    that.clearCanvas();
    that.context.drawImage(that.img, 0, 0);

    that.commandStack.pop();
    $.each(that.commandStack, function(){
        $.each(this, function(){
            this();
        })
    });
};

// 获取图片的缩放尺寸
Mosaic.prototype.getCompressSize = function(w, h){
    var ratio = this.scale = this.getPantographRatio(this.winW, this.winH, w, h);
    return {
        width: Math.round(w * ratio),
        height: Math.round(h * ratio),
    };
};

Mosaic.prototype.getPantographRatio = function(maxW, maxH, w, h){
    return Math.min(maxW / w, maxH / h, 1) / 1.1;
};

Mosaic.prototype.clearCanvas = function(){
    this.context.clearRect(0, 0, this.canvasW, this.canvasH);  
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

Mosaic.prototype.createCoordinateLine = function(x, y){
    this.$coordinateLine  = $('<div class="coordinate-line"><div class="coordinate-line-x"></div><div class="coordinate-line-y"></div></div>');
    this.$coordinateLineX = this.$coordinateLine.find('.coordinate-line-x');
    this.$coordinateLineY = this.$coordinateLine.find('.coordinate-line-y');

    this.$coordinateLineX.css({ left: x });
    this.$coordinateLineY.css({ top: y });

    this.$coordinateLine.appendTo('body');
};

Mosaic.prototype.drawCoordinateLine = function(x, y){
    var maxLeft   = this.$canvas.offset().left;
    var maxRight  = maxLeft + this.$canvas.width();
    var maxTop    = this.$canvas.offset().top;
    var maxBottom = maxTop + this.$canvas.height();

    if(x <= maxLeft){
        x = maxLeft;
    }else if(x >= maxRight){
        x = maxRight;
    }

    if(y <= maxTop){
        y = maxTop;
    }else if(y >= maxBottom){
        y = maxBottom;
    }

    this.$coordinateLineX.css({ left: x });
    this.$coordinateLineY.css({ top: y });
};

Mosaic.prototype.clearCoordinateLine = function(){
    if(this.$coordinateLine){
        this.$coordinateLine.remove();
        this.$coordinateLine = null;
    }
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


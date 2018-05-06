[x] 根据画笔粗细，绘制好一层马赛克覆盖到图片上，然后再在上面绘制一层图片原貌，接下来根据
鼠标的涂抹位置，修改该区域的透明度，刚好显露地下的马赛克层，达到绘制马赛克的效果，还剩实现
圆角的画笔

关于历史记录
    定义一个操作的周期
        鼠标按下 ---- 鼠标松开为一个操作记录周期

[x] 用户从本地选择图片读取和载入
[x] 从页面上读取的图片
[x] 给图片绑定启动事件
[x] 工作台弹层
[x] 编辑完成后的上传 写入本地 写入页面
[x] 撤销 重做功能

图片放大
放大后的拖动
正好可以参考PhotoSwipe

上传模块用nodejs模拟




绑定content上的移动事件，获取移动坐标数值
然后用这个坐标值在canvas上绘制马赛克


1. 给图片容器绑定点击事件
2. 点击事件触发后获取被点击的元素，用这个元素内图片初始化Mosaic


# Mosaic的流程

1. 创建弹出层插入页面
2. 将实例化传入的img元素绘制到弹出层里面的canvas上
3. 支持撤销


maxW maxH 为容器尺寸
w h 为需要压缩的原始尺寸

这里用 容器尺寸除以图片尺寸 得到的是 容器占图片的倍率
比如 1000 / 2000 = 0.5 也就是容器的尺寸是图片的0.5倍

那么我们要在压缩的图片上1000的位置画一个点 该怎么计算呢?
由于需要完整显示2000的图片在1000的画布上的画，那么图片就被压缩了0.5
然后你现在需要在图片上绘制1000的位置，那就需要在

画布 对应 原图的关系就是 1000 - 2000 也就是把2000px的图显示在了1000px的画布上
那么我们在画布上500px的位置就等于图片上的1000px

那么我们(e.clientX - offset.left) / 0.5 or (e.clientX - offset.left) * 2


````
var getCompressSize = function(maxW, maxH, w, h){
    var scale = this.scale = Math.min(maxW / w, maxH / h, 1);
    return {
        width: Math.round(w * scale),
        height: Math.round(h * scale),
    };
};
````
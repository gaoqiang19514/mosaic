var http = require('http'),
    fs = require('fs'),
    express = require('express'),
    formidable = require('formidable'),

    app = express(),
    server = http.createServer(app);

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(__dirname));
    app.use(app.router);
});

app.get('/', function(request, response){
    response.send('Hello Express');
});

app.get('/files', function(request, response){
    response.send('some files');
});

app.post('/upload', function(request, response){

    var imgData = request.body.imgData;
    //过滤data:URL
    var base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
    var dataBuffer = new Buffer(base64Data, 'base64');
    var date = new Date().getTime();
    fs.writeFile("./upload/" + date + "image.png", dataBuffer, function(err) {
        if(err){
          response.send(err);
        }else{
            var url = "./upload/" + date + "image.png";
          response.send({
              "url": url
          });
        }
    });
});



server.listen(3000);

console.log('Express server listening on port &d in %s mode',
    server.address().port, app.settings.env);
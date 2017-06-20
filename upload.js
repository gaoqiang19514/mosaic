        function b64toBlob(b64Data, contentType, sliceSize) {
            contentType = contentType || '';
            sliceSize = sliceSize || 512;

            var byteCharacters = atob(b64Data);
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);

                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {type: contentType});
            return blob;
        }

        function render(src){
            var img = new Image();
            img.onload = function(){
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;

                context.drawImage(img, 0, 0, img.width, img.height);
                var $item = $('<div class="upload__item"></div>').append(canvas).append('<button>开始上传</button>');
                $('.upload__wrap').append($item);
                currentFile = canvas.toDataURL("image/jpeg", 0.7).split(',')[1];
            };
            img.src = src;
        }

        var currentFile = null;

        $('#test_file').on('change', function(e){
            var file = e.target.files[0];
            var reader = new FileReader();

            reader.onload = function(e){
                src = e.target.result;
                currentFile = src;
                render(src);

                var fileBlob = b64toBlob(currentFile.split(',')[1], "image/jpeg");
                var data = new FormData();
                data.append("imageFile", fileBlob);

                $.ajax({
                    url: '/p2p/borrow/uploadfile.shtml',
                    type: 'POST',
                    dataType: 'json',
                    data: data,
                    processData: false,
                    contentType: false,
                })
                .done(function(data){
                    console.log(data);
                    console.log("success");
                })
                .fail(function() {
                    console.log("error");
                })
                .always(function() {
                    console.log("complete");
                });

            };
            reader.readAsDataURL(file);
        });

        $('.upload__wrap').on('click', ".upload__item", function(e){
            console.log($(this).find('canvas'));
        });

        // $('#test_file').fileupload({
        //     url: "/p2p/borrow/uploadfile.shtml",
        //     dataType: 'json',
        //     add: function(e, data){
        //         $('.test-area').append($('<div><button>start</button></div>').on('click', function(){
        //             $(this).replaceWith($('<p/>').text('Uploading...'));
        //             data.submit();
        //         }))

        //     },
        //     done: function(e, data){
        //         console.log('done')
        //     }
        // });

    });
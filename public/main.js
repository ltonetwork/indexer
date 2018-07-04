'use strict'

+function() {
    var hash = '';
    var fileContent = '';

    //Handle changes in text
    $(document).on('change keyup', '#text-data .text', function(e) {
        reset();
    });

    //Handle changes in file input
    $(document).on('change.bs.fileinput clear.bs.fileinput', '#file-data .fileinput', function(e) {
        console.log('change file!');
        reset();

        const $file = $(this).find('input[type="file"]');
        getFileContents($file);
    });

    //Verify data
    $(document).on('click', '.verify', function(e) {
        const $text = $('#text-data .text');
        const data = $text.is(':visible') ? $text.val() : fileContent;

        if (!data.length) {
            return showMessage('No data to verify');
        }

        hash = createHash(data);
        verifyHash(hash, (result, error) => {
            if (error) {
                return showMessage(error);
            }

            if (!result.checkpoint) {
                showButton('.save');
                showMessage('Hash ' + hash + ' does not exists in blockchain');
                return;
            }

            showMessage(result.checkpoint);
        });
    });

    //Save hash to blockchain
    $(document).on('click', '.save', function(e) {
        if (!hash) {
            return showMessage('App error: the hash is not set');
        }

        saveHash(hash, (result, error) => {
            if (error) {
                return showMessage(error);
            }

            if (!result.checkpoint) {
                showMessage('There was an error while saving hash ' + hash);
                return;
            }

            reset();
            showMessage(result.checkpoint);
        });
    });

    //Reset app state
    function reset() {
        showButton('.verify');
        showMessage('');
        fileContent = '';
        hash = '';
    }

    //Create hash of data
    function createHash(data) {
        const hashObj = sha256.create();
        hashObj.update(data);
        return hashObj.hex();
    }

    //Verify existens of hash in blockchain
    function verifyHash(hash, callback) {
        console.log('verify hash: ', hash);

        $.ajax({
            url: '/' + hash + '/verify',
            type: 'get'
        }).done(function(response) {
            callback(response);
        }).fail(function(xhr) {
            callback({}, 'There was an error while verifing hash ' + hash);
        });
    }

    //Save hash to blockchain
    function saveHash(hash, callback) {
        console.log('save hash: ', hash);

        $.ajax({
            url: '/' + hash + '/save',
            type: 'post'
        }).done(function(response) {
            callback(response);
        }).fail(function(xhr) {
            callback({}, 'There was an error while saving hash ' + hash);
        });
    }

    //Get uploaded file contents
    function getFileContents($file) {
        const files = $file[0].files;
        if (!files.length) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = function(loaded) {
            fileContent = loaded.target.result;
            console.log('set file contents: ', fileContent);
        };

        reader.readAsDataURL(file);
    }

    //Show message about verification or save process
    function showMessage(message) {        
        if ($.type(message) === 'object') {
            message = JSON.stringify(message, null, '\t');
        }

        $('.response').show().html(message);
    }

    //Toggle buttons
    function showButton(selector) {
        $('.buttons .btn').hide().parent().find(selector).show();    
    }
}();

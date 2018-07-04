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

        toggleButtonState('.verify', 'loading');

        hash = createHash(data);
        verifyHash(hash, (result, error) => {
            toggleButtonState('.verify', 'done');

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

        toggleButtonState('.save', 'loading');

        saveHash(hash, (result, error) => {
            toggleButtonState('.save', 'done');

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
        $.ajax({
            url: '/' + hash + '/verify',
            type: 'get',
            dataType: 'json'
        }).done(function(response) {
            callback(response);
        }).fail(function(xhr) {
            var errorMessage = 'There was an error while verifing hash ' + hash;
            const response = JSON.parse(xhr.responseText);

            if ($.type(response) === 'object' && response.error) {
                errorMessage += ":\n\n" + response.error;
            }

            callback({}, errorMessage);
        });
    }

    //Save hash to blockchain
    function saveHash(hash, callback) {
        $.ajax({
            url: '/' + hash + '/save',
            type: 'post',
            dataType: 'json'
        }).done(function(response) {
            callback(response);
        }).fail(function(xhr) {
            var errorMessage = 'There was an error while saving hash ' + hash;
            const response = JSON.parse(xhr.responseText);

            if ($.type(response) === 'object' && response.error) {
                errorMessage += ":\n\n" + response.error;
            }

            callback({}, errorMessage);
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
        };

        reader.readAsDataURL(file);
    }

    //Show message about verification or save process
    function showMessage(message) {        
        if ($.type(message) === 'object') {
            message = JSON.stringify(message, null, 4);
        }

        $('.response').show().html(message);
    }

    //Toggle buttons
    function showButton(selector) {
        $('.buttons .btn').hide().parent().find(selector).show();    
    }

    //Toggle button state
    function toggleButtonState(selector, state) {
        const $button = $('.buttons').find(selector);

        if (state === 'loading') {
            $button
                .addClass('disabled')
                .data('text', $button.html())
                .html('...');
        } else if (state === 'done') {
            $button
                .removeClass('disabled')
                .html($button.data('text'));
        }
    }
}();

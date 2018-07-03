'use strict'

+function() {
    var fileContent = '';

    //Handle changes in text
    $(document).on('change keyup', '#text-data .text', function(e) {
        showButton('.verify');
        showMessage('');
    });

    //Handle changes in file input
    $(document).on('change.bs.fileinput clear.bs.fileinput', '#file-data .fileinput', function(e) {
        console.log('change file!');
        showButton('.verify');
        showMessage('');
        fileContent = '';

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

        const hash = createHash(data);
        verifyHash(hash, (result, error) => {
            if (error) {
                return showMessage(error);
            }

            if (!result.transaction) {
                showButton('.save');
                showMessage('Hash ' + hash + ' does not exists in blockchain');
                return;
            }

            showMessage(result.transaction);
        });
    });

    //Create hash of data
    function createHash(data) {
        const hash = sha256.create();
        hash.update(data);
        return hash.hex();
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
        $('.response').show().html(message);
    }

    //Toggle buttons
    function showButton(selector) {
        $('.buttons .btn').hide().parent().find(selector).show();    
    }
}();

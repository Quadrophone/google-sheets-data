'use strict';

var processData =  function(data) {
    if (typeof data !== 'object') data = JSON.parse(data);
    data = data.feed.entry;

    data = data.map(function(d) {
        var fields = {};
        Object.keys(d).forEach(function(key, value) {
            if (key.includes('gsx$')) {
                var niceKey = key.replace('gsx$', '');
                fields[niceKey] = d[key].$t;
            }
        });
        return fields;
    });
    return data;
};

module.exports = {

    read: function(sheetId) {
        var url = 'https://spreadsheets.google.com/feeds/list/' + sheetId + '/od6/public/values?alt=json';

        return new Promise(function(resolve, reject) {

            if (typeof window === 'undefined') {
                // this is running in node
                const https = require('https');
                https.get(url, function(response) {
                    if (response.statusCode !== 200) {
                        reject(response.statusMessage);
                        response.resume();
                        return;
                    }
                    var data = '';
                    response.on('data', function(chunk) { data += chunk });
                    response.on('end', function() {
                        data = processData(data);
                        resolve(data);
                    });

                })
            } else {

                function jsonp(url, callback) {
                    var callbackName = "jsonp_callback_" + Math.round(100000 * Math.random());
                    window[callbackName] = function(data) {
                        delete window[callbackName];
                        document.body.removeChild(script);
                        callback(data);
                    };

                    var script = document.createElement("script");
                    script.src =
                        url + (url.indexOf("?") >= 0 ? "&" : "?") + "callback=" + callbackName;
                    document.body.appendChild(script);
                }

                jsonp(url, function(data) {
                    data = processData(data);
                    resolve(data);
                });
            }
        });
    }
};
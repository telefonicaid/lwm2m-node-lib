'use strict';


function getDeviceTypeFromUrlRequest(urlObj, config) {
    if (urlObj.pathname === '/rd') {

        if (urlObj.query.includes('&type=')) {
            var type;

            urlObj.query.split('&').forEach(
                function (queryParam) {
                    if (queryParam.includes('type=')) {
                        type = queryParam.split('=')[1];
                    }
                }
            );

            for (var i in config.types) {
                if (type === config.types[i].name) {
                    return type;
                }
            }

        }
        else {
            return config.defaultType;
        }

    }

    else if (config.types) {

        for (var j in config.types) {

            if (urlObj.pathname.includes(config.types[j].url)) {
                return config.types[j].name;
            }

        }

    }

}

exports.getDeviceTypeFromUrlRequest = getDeviceTypeFromUrlRequest;

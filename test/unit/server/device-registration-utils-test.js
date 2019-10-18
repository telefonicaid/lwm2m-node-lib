'use strict';

var registrationUtils = require('../../../lib/services/server/utils/deviceRegistrationUtils'),
    assert = require('assert');

describe('Device registration utils ', function () {

    describe('When device registers with /rd and no type in query params', function () {

        var config = {
            defaultType: 'defaultType'
        };

        var urlObj = {
            pathname: '/rd',
            query: 'ep=testEndpoint&lt=85671&lwm2m=1.0&b=U'
        };

        var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

        it('should return default type', function () {
            assert.equal(actual, config.defaultType);
        });
    });

    describe('When device registers with /service/rd', function () {

        var urlObj = {
            pathname: '/service/rd',
            query: 'ep=testEndpoint&lt=85671&lwm2m=1.0&b=U'
        };


        it('if config.types include service should return service type', function () {
            var config = {
                defaultType: 'defaultType',
                types: [{
                    url: '/service',
                    name: 'service'
                }]
            };
            var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

            assert.equal(actual, 'service');
        });

        it('if config.types include service should return service type', function () {
            var config = {
                defaultType: 'defaultType',
                types: []
            };
            var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

            assert.equal(actual, undefined);
        });

    });

    describe('When device registers with /rd and type in query params', function () {

        var urlObj = {
            pathname: '/rd',
            query: 'ep=testEndpoint&lt=85671&lwm2m=1.0&b=U&type=service'
        };


        it('if config.types include service should return service type', function () {
            var config = {
                defaultType: 'defaultType',
                types: [{
                    url: '/service',
                    name: 'service'
                }]
            };
            var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

            assert.equal(actual, 'service');
        });

        it('if config.types include service should return service type', function () {
            var config = {
                defaultType: 'defaultType',
                types: []
            };
            var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

            assert.equal(actual, undefined);
        });

    });


});

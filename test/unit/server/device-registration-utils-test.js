/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of lwm2m-node-lib
 *
 * lwm2m-node-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * lwm2m-node-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with lwm2m-node-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */


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

    describe('When device registers with type /rd/rd', function () {

        var urlObj = {
            pathname: '/rd/rd',
            query: 'ep=testEndpoint&lt=85671&lwm2m=1.0&b=U'
        };

        it('should return default type', function () {
            var config = {
                defaultType: 'defaultType',
                types: [
                    {
                        url: '/service',
                        name: 'service'
                    },
                    {
                        url: '/rd',
                        name: 'rd'
                    }
                ]
            };
            var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

            assert.equal(actual, 'defaultType');
        });

    });

    describe('When device registers with type /lightConfig/rd', function () {

        var urlObj = {
            pathname: '/lightConfig/rd',
            query: 'ep=testEndpoint&lt=85671&lwm2m=1.0&b=U'
        };

        it('should return LightConfig type', function () {
            var config = {
                defaultType: 'defaultType',
                types: [
                    {
                        url: '/light',
                        name: 'Light'
                    },
                    {
                        url: '/lightConfig',
                        name: 'LightConfig'
                    }
                ]
            };
            var actual = registrationUtils.getDeviceTypeFromUrlRequest(urlObj, config);

            assert.equal(actual, 'LightConfig');
        });

    });


});

/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of iotagent-lwm2m-lib
 *
 * iotagent-lwm2m-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * iotagent-lwm2m-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with iotagent-lwm2m-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

'use strict';

var libLwm2m2 = require('../../../').server,
    coap = require('coap'),
    utils = require('./../testUtils'),
    config = require('../../../config'),
    async = require('async'),
    should = require('should'),
    testInfo = {};

describe('Client unregistration tests', function() {
    var deviceLocation;

    function registerHandlers(callback) {
        libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
            function(endpoint, lifetime, version, binding, payload, innerCb) {
                innerCb();
            });

        callback();
    }

    beforeEach(function (done) {
        libLwm2m2.start(config.server, function (error, srvInfo){
            testInfo.serverInfo = srvInfo;

            async.series([
                libLwm2m2.getRegistry().clean,
                registerHandlers,
                async.apply(utils.registerClient, 'ROOM001')
            ], function (error, results) {
                deviceLocation = results[2][0];
                done();
            });
        });
    });

    afterEach(function(done) {
        libLwm2m2.stop(testInfo.serverInfo, done);
    });

    describe('When a unregistration for a not registered device arrives', function () {
        var removeRequest = {
            host: 'localhost',
                port: config.server.port,
                method: 'DELETE',
                pathname: '/rd/136'
        };

        beforeEach(function () {
            libLwm2m2.setHandler(testInfo.serverInfo, 'unregistration', function(device, callback) {
                callback();
            });
        });

        it('should return a 4.04 Not found code', utils.checkCode(testInfo, removeRequest, '', '4.04'));
    });
    describe('When a correct client unregistration request arrives', function() {
        var removeRequest = {
            host: 'localhost',
            port: config.server.port,
            method: 'DELETE'
        };

        beforeEach(function (done) {
            removeRequest.pathname = deviceLocation;
            done();
        });

        it('should remove the device registration', function(done) {
            var req = coap.request(removeRequest),
                handlerCalled = false;

            libLwm2m2.setHandler(testInfo.serverInfo, 'unregistration', function(device, callback) {
                should.exist(device);
                should.exist(device.name);
                device.name.should.equal('ROOM001');
                handlerCalled = true;
                callback();
            });

            req.on('response', function(res) {
                handlerCalled.should.equal(true);
                done();
            });

            req.end();
        });
        it('should return a 4.04 Not found code', utils.checkCode(testInfo, removeRequest, '', '2.02'));
    });
});
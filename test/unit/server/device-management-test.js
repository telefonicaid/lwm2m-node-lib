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
    utils = require('./../testUtils'),
    config = require('../../../config'),
    libcoap = require('coap'),
    should = require('should'),
    server = libcoap.createServer(),
    async = require('async'),
    testInfo = {};

describe('Device management interface' , function() {
    var deviceLocation;

    function registerHandlers(callback) {
        libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
            function(endpoint, lifetime, version, binding, innerCb) {
                innerCb();
            });

        libLwm2m2.setHandler(testInfo.serverInfo, 'updateRegistration', function(object, innerCb) {
            innerCb();
        });

        callback();
    }

    beforeEach(function (done) {
        libLwm2m2.start(config.server, function (error, srvInfo){
            testInfo.serverInfo = srvInfo;

            async.series([
                registerHandlers,
                async.apply(utils.registerClient, 'ROOM001')
            ], function (error, results) {
                server.listen(function (error) {
                    deviceLocation = results[1];
                    done();
                });
            });
        });
    });

    afterEach(function(done) {
        libLwm2m2.stop(testInfo.serverInfo, function (error) {
            server.removeAllListeners('request');
            server.close(done);
        });
    });

    describe('When the user invokes the Read operation on an attribute', function() {
        it('should send a COAP GET Operation on the selected attribute', function (done) {
            server.on('request', function (req, res) {
                req.method.should.equal('GET');
                res.code = '2.05';
                res.end('The Read content');

            });

            libLwm2m2.read(deviceLocation.split('/')[2], '6', '2', '5', function (error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('The Read content');
                done();
            });
        });
    });
    describe('When the user invokes the Write operation on an attribute', function() {
        it('should send a COAP PUT Operation on the selected attribute', function (done) {
            var data = '';

            server.on('request', function (req, res) {
                req.method.should.equal('PUT');
                res.code = '2.04';

                data = res._request.payload.toString();
                res.end('The content');
            });

            libLwm2m2.write(deviceLocation.split('/')[2], '6', '2', '5', 'The value', function (error) {
                should.not.exist(error);
                data.should.equal('The value');
                done();
            });
        });
    });
    describe('When the user invokes the Execute operation on an attribute', function() {
        it('should send a COAP POST Operation on the selected attribute');
    });
    describe('When the user invokes the Discovery operation on an attribute', function() {
        it('should send a COAP GET Operation on the selected attributes ' +
            'with the Accept: application/link-format header');
    });
    describe('When the user invokes the Write Attributes operation on an attribute', function() {
        it('should send a COAP PUT Operation on the selected attribute ' +
            'with the given parameters and without payload');
    });
});
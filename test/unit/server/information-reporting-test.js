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

describe('Information reporting interface', function() {
    var deviceLocation;

    function registerHandlers(callback) {
        libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
            function(endpoint, lifetime, version, binding, payload, innerCb) {
                innerCb();
            });

        libLwm2m2.setHandler(testInfo.serverInfo, 'updateRegistration', function(object, innerCb) {
            innerCb();
        });

        callback();
    }

    function emptyHandler(data, callback) {
        callback(null);
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
        async.series([
            libLwm2m2.cleanObservers,
            async.apply(libLwm2m2.stop, testInfo.serverInfo)
        ], function (error) {
            server.removeAllListeners('request');
            server.close(done);
        });
    });

    describe.only('When the user invokes the Observe operation on an object', function() {
        it('should send a COAP GET Request with a generated Observe Token for all the instances of the object',
            function (done) {
                server.on('request', function (req, res) {
                    req.method.should.equal('GET');
                    req.options.should.containDeep([{name: 'Observe'}]);
                    res.code = '2.05';
                    res.setOption('Observe', 1);
                    res.end('The Read content');
                });

                libLwm2m2.observe(deviceLocation.split('/')[2], '6', '2', '5', emptyHandler, function (error, result) {
                    should.not.exist(error);
                    should.exist(result);
                    result.should.equal('The Read content');
                    done();
                });
        });
        it('should store the subscription to the value ', function (done) {
            server.on('request', function (req, res) {
                res.code = '2.05';
                res.setOption('Observe', 1);
                res.end('The Read content');
            });

            libLwm2m2.observe(deviceLocation.split('/')[2], '6', '2', '5', emptyHandler, function (error, result) {
                should.not.exist(error);

                libLwm2m2.listObservers(function (error, result) {
                    should.not.exist(error);
                    result.length.should.equal(1);
                    result[0].resource.should.equal('/6/2/5');
                    result[0].deviceId.should.equal(deviceLocation.split('/')[2]);
                    done();
                });
            });
        });
    });
    describe('When the user invokes the Observe operation on an object instance', function() {
        it('should send a COAP GET Request with a generated Observe Token for the selected instance');
    });
    describe('When the user invokes the Observe operation on a resource', function() {
        it('should send a COAP GET Request with a generated Observe Token for the particular resource');
    });
    describe('When a Notify message arrives with an Observe Token', function() {
        it('should invoke the user notification handler');
    });
    describe('When the user invokes the Cancel operation on an object', function() {
        it('should send a COAP Reset message to the client with the last response ID for that object');
    });
    describe('When the user invokes the Cancel operation on an resource', function() {
        it('should send a COAP Reset message to the client with the last response ID for that resource');
    });
    describe('When the user invokes the Cancel operation on an instance', function() {
        it('should send a COAP Reset message to the client with the last response ID for that instance');
    });
});
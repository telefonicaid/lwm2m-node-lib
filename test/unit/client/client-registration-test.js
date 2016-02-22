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

var should = require('should'),
    async = require('async'),
    lwm2mServer = require('../../../').server,
    lwm2mClient = require('../../../').client,
    memoryRegistry = require('../../../lib/services/server/inMemoryDeviceRegistry'),
    config = require('../../../config'),
    localhost,
    testInfo = {};


describe('Client-initiated registration', function() {
    beforeEach(function(done) {
        if (config.server.ipProtocol === 'udp6') {
            localhost = '::1';
        } else {
            localhost = '127.0.0.1';
        }

        lwm2mClient.init(config);

        lwm2mClient.registry.reset(function() {
            memoryRegistry.clean(function () {
                lwm2mServer.start(config.server, function (error, srvInfo) {
                    testInfo.serverInfo = srvInfo;
                    done();
                });
            });
        });
    });
    afterEach(function(done) {
        memoryRegistry.clean(function() {
            async.series([
                async.apply(lwm2mServer.stop, testInfo.serverInfo),
                lwm2mClient.registry.reset,
                lwm2mClient.cancellAllObservers
            ], function() {
                lwm2mClient.registry.bus.removeAllListeners();
                done();
            });
        });
    });

    describe('When the client tries to register in an existent LWTM2M server', function() {
        var deviceInformation;

        beforeEach(function (done) {
            async.series([
                async.apply(lwm2mClient.registry.create, '/0/1'),
                async.apply(lwm2mClient.registry.create, '/3/14'),
                async.apply(lwm2mClient.registry.create, '/2/9')
            ], done);
        });

        afterEach(function (done) {
            async.series([
                async.apply(lwm2mClient.registry.remove, '/0/1'),
                async.apply(lwm2mClient.registry.remove, '/3/14'),
                async.apply(lwm2mClient.registry.remove, '/2/9')
            ], function (error) {
                if (deviceInformation) {
                    lwm2mClient.unregister(deviceInformation, done);
                } else {
                    done();
                }
            });
        });
        it('should send a COAP POST Message with the required parameters', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler(testInfo.serverInfo, 'registration',
                function (endpoint, lifetime, version, binding, payload, callback) {
                    should.exist(endpoint);
                    should.exist(lifetime);
                    should.exist(binding);
                    should.exist(version);
                    endpoint.should.equal('testEndpoint');
                    lifetime.should.equal(config.client.lifetime);
                    binding.should.equal('U');
                    handlerCalled = true;
                    callback(null);
                });

            lwm2mClient.register(localhost, config.server.port, null, 'testEndpoint',
                function (error, info) {
                    handlerCalled.should.equal(true);
                    deviceInformation = info;
                    done();
                });
        });
        it('should pass the returned location to the callback if there is no error');
        it('should send the complete set of supported objects', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler(testInfo.serverInfo, 'registration',
                function (endpoint, lifetime, version, binding, payload, callback) {
                    handlerCalled = true;
                    payload.should.equal('</0/1>,</3/14>,</2/9>');
                    callback(null);
                });

            lwm2mClient.register(localhost, config.server.port, null, 'testEndpoint',
                function (error, info) {
                    handlerCalled.should.equal(true);
                    deviceInformation = info;
                    done();
                });
        });
    });
    describe('When the client tries to register in an unexistent server', function() {
        var deviceInformation;

        afterEach(function (done) {
            if (deviceInformation) {
                lwm2mClient.unregister(deviceInformation, done);
            } else {
                done();
            }
        });
        it('should raise a SERVER_NOT_FOUND error', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler(testInfo.serverInfo, 'registration',
                function (endpoint, lifetime, version, binding, payload, callback) {
                    handlerCalled = true;
                    callback(null);
                });

            lwm2mClient.register('http://unexistent.com', 12345, null, 'testEndpoint',
                function (error, info) {
                    should.exist(error);
                    error.name.should.equal('SERVER_NOT_FOUND');
                    handlerCalled.should.equal(false);
                    done();
                });
        });
    });
    describe('When the client update method is executed', function() {
        var deviceInformation;

        beforeEach(function(done) {
            lwm2mServer.setHandler(testInfo.serverInfo, 'registration',
                function (endpoint, lifetime, version, binding, payload, callback) {
                    callback(null);
                });

            lwm2mServer.setHandler(testInfo.serverInfo, 'unregistration', function (device, callback) {
                callback(null);
            });

            lwm2mClient.registry.create('/3/14', function (error) {
                lwm2mClient.register(localhost, config.server.port, null, 'testEndpoint', function (error, info) {
                    deviceInformation = info;
                    lwm2mClient.registry.create('/7/5', done);
                });
            });
        });

        afterEach(function (done) {
            async.series([
                async.apply(lwm2mClient.registry.remove, '/3/14'),
                async.apply(lwm2mClient.registry.remove, '/7/5')
            ], function (error) {
                if (deviceInformation) {
                    lwm2mClient.unregister(deviceInformation, done);
                } else {
                    done();
                }
            });
        });

        it('should send a COAP UPDATE Message with the required parameters', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler(testInfo.serverInfo, 'updateRegistration', function (device, payload, callback) {
                should.exist(device);
                handlerCalled = true;
                callback(null);
            });

            lwm2mClient.update(deviceInformation, function (error) {
                handlerCalled.should.equal(true);
                done();
            });
        });

        it('should update the set of supported objects', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler(testInfo.serverInfo, 'updateRegistration', function (device, payload, callback) {
                should.exist(device);
                should.exist(payload);
                payload.should.equal('</3/14>,</7/5>');
                handlerCalled = true;
                callback(null);
            });

            lwm2mClient.update(deviceInformation, function (error) {
                handlerCalled.should.equal(true);
                done();
            });

        });
    });
    describe('When the client unregistration method is executed', function() {
        var deviceInformation;

        beforeEach(function(done) {
            lwm2mServer.setHandler(testInfo.serverInfo, 'registration',
                function (endpoint, lifetime, version, binding, payload, callback) {
                    callback(null);
                });

            lwm2mClient.register(localhost, config.server.port, null, 'testEndpoint', function (error, info) {
                deviceInformation = info;
                done();
            });
        });

        it('should send a COAP DELETE Message to the provided location', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler(testInfo.serverInfo, 'unregistration', function (device, callback) {
                should.exist(device);
                handlerCalled = true;
                callback(null);
            });

            lwm2mClient.unregister(deviceInformation, function (error) {
                handlerCalled.should.equal(true);
                done();
            });

        });
    });
    describe('When the client registration method is rejected with an error', function() {
        it('should invoke the callback with the appropriate error');
    });
    describe('When the client update registration method is rejected with an error', function() {
        it('should invoke the callback with the same error');
    });
    describe('When the client unregistration method is rejected with an error', function() {
        it('should invoke the callback with the same error');
    });
});
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
    apply = async.apply,
    lwm2mServer = require('../../../').server,
    lwm2mClient = require('../../../').client,
    config = require('../../../config'),
    localhost,
    testInfo = {};

function emptyHandler(data) {

}

describe('Client-side information management', function() {
    var deviceInformation,
        deviceId;

    beforeEach(function(done) {
        if (config.server.ipProtocol === 'udp6') {
            localhost = '::1';
        } else {
            localhost = '127.0.0.1';
        }

        lwm2mClient.init(config);

        lwm2mServer.start(config.server, function (error, srvInfo) {
            testInfo.serverInfo = srvInfo;

            lwm2mClient.register(localhost, config.server.port, null, 'testEndpoint', function (error, result) {
                deviceInformation = result;
                deviceId = deviceInformation.location.split('/')[1];
                lwm2mClient.registry.create('/3/6', done);
            });
        });
    });

    afterEach(function(done) {
        async.series([
            apply(lwm2mClient.unregister, deviceInformation),
            apply(lwm2mClient.registry.remove, '/3/6'),
            apply(lwm2mServer.stop, testInfo.serverInfo),
            lwm2mClient.registry.reset,
            lwm2mClient.cancellAllObservers
        ], function() {
            lwm2mClient.registry.bus.removeAllListeners();
            done();
        });
    });

    describe('When a Read requests arrives to the client with the Observe Option for value changes', function () {
        var obj = {
            type: '3',
            id: '6',
            resource: '2',
            value: 'ValueToBeRead',
            uri: '/3/6'
        };

        beforeEach(function(done) {
            lwm2mClient.registry.setResource(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should call the read handler once with the original value', function(done) {
            var handlerCalls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    should.exist(objectType);
                    should.exist(objectId);
                    should.exist(resourceId);
                    objectType.should.equal(obj.type);
                    objectId.should.equal(obj.id);
                    resourceId.should.equal(obj.resource);
                    handlerCalls++;
                    callback(null, resourceValue);
                });

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, emptyHandler, function(error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal(obj.value);
                handlerCalls.should.equal(1);
                done();
            });
        });

        it('should return the current value of the selected object', function(done) {
            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, emptyHandler, function(error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal(obj.value);
                done();
            });
        });

        it('should update the value each time there is a new value', function(done) {
            var serverHandlerCalls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            function serverHandler() {
                serverHandlerCalls++;
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, serverHandler, function(error, result) {
                should.not.exist(error);

                async.series([
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 21),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 89),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 7)
                ], function (error) {
                    should.not.exist(error);

                    setTimeout(function () {
                        serverHandlerCalls.should.equal(3);
                        done();
                    }, 1000);
                });
            });
        });

        it('should only send updates for the selected resource', function(done) {
            var serverHandlerCalls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            function serverHandler() {
                serverHandlerCalls++;
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, serverHandler, function(error, result) {
                should.not.exist(error);

                async.series([
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 21),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, '12', 408),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 89),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, '28', 988),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 7)
                ], function (error) {
                    should.not.exist(error);

                    setTimeout(function () {
                        serverHandlerCalls.should.equal(3);
                        done();
                    }, 1000);
                });
            });
        });
    });

    describe('When two observers are created for resources of the same object and one of them is updated', function () {
        var obj = {
            type: '3',
            id: '6',
            value: 'ValueToBeRead',
            uri: '/3/6'
        };

        beforeEach(function(done) {
            lwm2mClient.registry.setResource(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should create two different observers, one for each resource', function(done) {
            var server1Calls = 0,
                server2Calls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            function server1() {
                server1Calls++;
            }

            function server2() {
                server2Calls++;
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, '1', server1, function(error, result) {
                lwm2mServer.observe(deviceId, obj.type, obj.id, '2', server2, function(error, result) {
                    lwm2mClient.listObservers(function (error, observerList) {
                        observerList.length.should.equal(2);
                        done();
                    });
                });
            });
        });

        it('should call only the handler of the updated resource', function(done) {
            var server1Calls = 0,
                server2Calls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            function server1() {
                server1Calls++;
            }

            function server2() {
                server2Calls++;
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, '1', server1, function(error, result) {
                lwm2mServer.observe(deviceId, obj.type, obj.id, '2', server2, function(error, result) {
                    async.series([
                        async.apply(lwm2mClient.registry.setResource, obj.uri, '1', 21),
                        async.apply(lwm2mClient.registry.setResource, obj.uri, '1', 408),
                        async.apply(lwm2mClient.registry.setResource, obj.uri, '2', 89),
                        async.apply(lwm2mClient.registry.setResource, obj.uri, '1', 988),
                        async.apply(lwm2mClient.registry.setResource, obj.uri, '2', 7)
                    ], function (error) {
                        should.not.exist(error);

                        setTimeout(function () {
                            server1Calls.should.equal(3);
                            server2Calls.should.equal(2);
                            done();
                        }, 1000);
                    });
                });
            });
        });
    });

    describe('When the client cancels an observed value', function() {
        var obj = {
            type: '3',
            id: '6',
            resource: '2',
            value: 'ValueToBeRead',
            uri: '/3/6'
        };

        beforeEach(function(done) {
            lwm2mClient.registry.setResource(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should cease sending messages to the remote server', function(done) {
            var serverHandlerCalls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            function serverHandler() {
                serverHandlerCalls++;
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, serverHandler, function(error, result) {
                should.not.exist(error);

                async.series([
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 21),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, '12', 408),
                    async.apply(lwm2mClient.cancelObserver, obj.uri, obj.resource),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 89),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, '28', 988),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 7)
                ], function (error) {
                    should.not.exist(error);

                    setTimeout(function () {
                        serverHandlerCalls.should.equal(1);
                        done();
                    }, 1000);
                });
            });
        });
    });

    describe('When a Read requests arrives to the client with an Maximum Period attribute of 100ms', function () {
        var obj = {
                type: '3',
                id: '6',
                resource: '2',
                value: 'ValueToBeRead',
                uri: '/3/6'
            },
            attributes = {
                pmax: 100
            };

        beforeEach(function(done) {
            async.series([
                apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, obj.value),
                apply(lwm2mServer.writeAttributes, deviceId, obj.type, obj.id, obj.resource, attributes)
            ], done);
        });

        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should update the value when the specified time lapse has passed', function(done) {
            var serverHandlerCalls = 0;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    callback(null, resourceValue);
                });

            function serverHandler() {
                serverHandlerCalls++;
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, serverHandler, function(error, result) {
                should.not.exist(error);

                async.series([
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 21),
                    async.apply(lwm2mClient.registry.setResource, obj.uri, obj.resource, 89)
                ], function (error) {
                    should.not.exist(error);

                    setTimeout(function () {
                        serverHandlerCalls.should.above(8);
                        done();
                    }, 1000);
                });
            });
        });
        it('should only send updates for the selected resource');
        it('should not send updates before the minimum time span selected');
        it('should send an update when the maximum elapsed time has passed');
    });
});
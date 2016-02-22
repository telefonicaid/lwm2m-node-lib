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
    memoryRegistry = require('../../../lib/services/server/inMemoryDeviceRegistry'),
    localhost,
    testInfo = {};

describe('Client-side device management', function() {
    var deviceInformation,
        deviceId;

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

                    lwm2mClient.register(localhost, config.server.port, null, 'testEndpoint', function (error, result) {
                        deviceInformation = result;
                        deviceId = deviceInformation.location.split('/')[1];
                        lwm2mClient.registry.create('/3/6', done);
                    });
                });
            });
        });
    });

    afterEach(function(done) {
        async.series([
            apply(lwm2mClient.registry.remove, '/3/6'),
            apply(lwm2mClient.unregister, deviceInformation),
            lwm2mClient.registry.reset,
            apply(lwm2mServer.stop, testInfo.serverInfo)
        ], function (error) {
            done();
        });
    });

    describe('When a Write request arrives to the client', function() {
        var obj = {
            type: '3',
            id: '6',
            resource: '1',
            value: 'TheValue'
        };

        it('should change the appropriate value in the selected object', function (done) {
            var handlerCalled = false;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'write',
                function (objectType, objectId, resourceId, value, callback) {
                    should.exist(objectType);
                    should.exist(objectId);
                    should.exist(resourceId);
                    should.exist(value);
                    objectType.should.equal(obj.type);
                    objectId.should.equal(obj.id);
                    resourceId.should.equal(obj.resource);
                    value.should.equal(obj.value);
                    handlerCalled = true;
                    callback();
                });

            lwm2mServer.write(deviceId, obj.type, obj.id, obj.resource, obj.value, function(error) {
                should.not.exist(error);
                handlerCalled.should.equal(true);
                done();
            });
        });
    });
    describe('When a Read request arrives to the client for an existent resource of an existent object', function() {
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
        it('should send a response with the required object value', function(done) {
            var handlerCalled = false;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    should.exist(objectType);
                    should.exist(objectId);
                    should.exist(resourceId);
                    objectType.should.equal(obj.type);
                    objectId.should.equal(obj.id);
                    resourceId.should.equal(obj.resource);
                    handlerCalled = true;
                    callback(null, resourceValue);
                });

            lwm2mServer.read(deviceId, obj.type, obj.id, obj.resource, function(error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal(obj.value);
                handlerCalled.should.equal(true);
                done();
            });
        });
    });
    describe('When a Read request arrives to the client for an unexistent object instance', function() {
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
        it('should raise a 4.04 OBJECT_NOT_FOUND error', function (done) {
            var handlerCalled = false;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'write',
                function (objectType, objectId, resourceId, value, callback) {
                    handlerCalled = true;
                    callback();
                });

            lwm2mServer.write(deviceId, obj.type, '19', obj.resource, obj.value, function(error) {
                should.exist(error);
                handlerCalled.should.equal(false);
                error.name.should.equal('OBJECT_NOT_FOUND');
                done();
            });
        });
    });
    describe('When a Read request arrives to the client for an unexistent resource of an object', function() {
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
        it('should raise a 4.04 RESOURCE_NOT_FOUND error', function(done) {
            var handlerCalled = false;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'read',
                function (objectType, objectId, resourceId, resourceValue, callback) {
                    handlerCalled = true;
                    callback(null, resourceValue);
                });

            lwm2mServer.read(deviceId, obj.type, '75', obj.resource, function(error, result) {
                should.exist(error);
                should.not.exist(result);
                error.name.should.equal('RESOURCE_NOT_FOUND');
                handlerCalled.should.equal(false);
                done();
            });
        });
    });
    describe('When a Discover request arrives targeting an existent Object ID', function() {
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

        it('should return all the instances of the selected Object ID', function(done) {
            lwm2mServer.discover(deviceId, obj.type, function(error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('</3>,</3/6>');
                done();
            });
        });
    });
    describe('When a Discover request arrives targeting an existent Object instance ID', function() {
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

        it('should return all the resources of the selected Object instance ID', function(done) {
            lwm2mServer.discover(deviceId, obj.type, obj.id, function(error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('</3/6>,</3/6/2>');
                done();
            });
        });
    });
    describe('When a Discover request arrives targeting an unexistent resource ID', function() {
        it('should raise a RESOURCE_NOT_FOUND error');
    });
    describe('When a Discover request arrives targeting an unexistent object type ID', function() {
        it('should raise a OBJECT_NOT_FOUND error');
    });
    describe('When a Discover request arrives targeting an unexistent object instance ID', function() {
        it('should raise a OBJECT_NOT_FOUND error');
    });
    describe('When a Write attributes request arrives targeting an existent resource ID', function() {
        var obj = {
            type: '3',
            id: '6',
            resource: '2',
            value: 'ValueToBeRead',
            uri: '/3/6'
            },
            attributes = {
                pmin: 5000,
                pmax: 20000,
                gt: 14.5,
                lt: 3.1,
                st: 2000,
                cancel: false
            };

        beforeEach(function(done) {
            lwm2mClient.registry.setResource(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should overwrite the given attributes in the selected resource ID', function(done) {
            lwm2mServer.writeAttributes(
                deviceId,
                obj.type,
                obj.id,
                obj.resource,
                attributes,
                function(error) {
                    should.not.exist(error);

                    lwm2mServer.discover(deviceId, obj.type, obj.id, obj.resource, function(error, result) {
                        should.not.exist(error);
                        should.exist(result);
                        result.should.equal('</3/6/2>;pmin=5000;pmax=20000;gt=14.5;lt=3.1;st=2000;cancel=false');
                        done();
                    });
                });
        });
    });
    describe('When a Write attributes request arrives targeting an existent object type ID', function() {
        var obj = {
                type: '3',
                id: '6',
                resource: '2',
                value: 'ValueToBeRead',
                uri: '/3/6'
            },
            attributes = {
                pmin: 5000,
                pmax: 20000,
                gt: 14.5,
                lt: 3.1,
                st: 2000,
                cancel: false
            };

        beforeEach(function(done) {
            lwm2mClient.registry.setResource(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should overwrite the given attributes in the selected object type ID', function(done) {
            lwm2mServer.writeAttributes(
                deviceId,
                obj.type,
                null,
                null,
                attributes,
                function(error) {
                    should.not.exist(error);

                    lwm2mServer.discover(deviceId, obj.type, function(error, result) {
                        should.not.exist(error);
                        should.exist(result);
                        result.should.equal('</3>;pmin=5000;pmax=20000;gt=14.5;lt=3.1;st=2000;cancel=false,</3/6>');
                        done();
                    });
                });
        });
    });
    describe('When a Write attributes request arrives targeting an existent object instance ID', function() {
        var obj = {
                type: '3',
                id: '6',
                resource: '2',
                value: 'ValueToBeRead',
                uri: '/3/6'
            },
            attributes = {
                pmin: 5000,
                pmax: 20000,
                gt: 14.5,
                lt: 3.1,
                st: 2000,
                cancel: false
            };

        beforeEach(function(done) {
            lwm2mClient.registry.setResource(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetResource(obj.uri, obj.resource, done);
        });

        it('should overwrite the given attributes in the selected object instance ID', function(done) {
            lwm2mServer.writeAttributes(
                deviceId,
                obj.type,
                obj.id,
                null,
                attributes,
                function(error) {
                    should.not.exist(error);

                    lwm2mServer.discover(deviceId, obj.type, obj.id, function(error, result) {
                        should.not.exist(error);
                        should.exist(result);
                        result.should.equal('</3/6>;pmin=5000;pmax=20000;gt=14.5;lt=3.1;st=2000;cancel=false,</3/6/2>');
                        done();
                    });
                });
        });
    });
    describe('When a Write attributes request arrives targeting an unexistent resource ID', function() {
        it('should raise a RESOURCE_NOT_FOUND error');
    });
    describe('When a Write attributes request arrives targeting an unexistent object ID', function() {
        it('should raise a OBJECT_NOT_FOUND error');
    });
    describe('When a Execute request arrives to the client', function() {
        var obj = {
            type: '3',
            id: '6',
            resource: '1',
            value: 'TheValue'
        };

        it('should call the execution handler for the selected object', function (done) {
            var handlerCalled = false;

            lwm2mClient.setHandler(deviceInformation.serverInfo, 'execute',
                function (objectType, objectId, resourceId, args, callback) {
                    should.exist(objectType);
                    should.exist(objectId);
                    should.exist(resourceId);
                    should.exist(args);
                    objectType.should.equal(obj.type);
                    objectId.should.equal(obj.id);
                    resourceId.should.equal(obj.resource);
                    args.should.equal(obj.value);
                    handlerCalled = true;
                    callback();
                });

            lwm2mServer.execute(deviceId, obj.type, obj.id, obj.resource, obj.value, function(error) {
                should.not.exist(error);
                handlerCalled.should.equal(true);
                done();
            });
        });
    });
});
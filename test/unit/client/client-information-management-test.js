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
    testInfo = {};

function emptyHandler(data) {

}

describe('Client-side information management', function() {
    var deviceInformation,
        deviceId;

    beforeEach(function(done) {
        lwm2mServer.start(config.server, function (error, srvInfo) {
            testInfo.serverInfo = srvInfo;

            lwm2mClient.register('localhost', config.server.port, null, 'testEndpoint', function (error, result) {
                deviceInformation = result;
                deviceId = deviceInformation.location.split('/')[2];
                lwm2mClient.registry.create('/3/6', done);
            });
        });
    });

    afterEach(function(done) {
        async.series([
            apply(lwm2mClient.registry.remove, '/3/6'),
            apply(lwm2mClient.unregister, deviceInformation),
            apply(lwm2mServer.stop, testInfo.serverInfo)
        ], function() {
            lwm2mClient.registry.bus.removeAllListeners();
            done();
        });
    });

    describe.only('When a Read requests arrives to the client with the Observe Option for value changes', function () {
        var obj = {
            type: '3',
            id: '6',
            resource: '2',
            value: 'ValueToBeRead',
            uri: '/3/6'
        };

        beforeEach(function(done) {
            lwm2mClient.registry.setAttribute(obj.uri, obj.resource, obj.value, done);
        });
        afterEach(function(done) {
            lwm2mClient.registry.unsetAttribute(obj.uri, obj.resource, done);
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

                if (serverHandlerCalls === 3) {
                    done();
                }
            }

            lwm2mServer.observe(deviceId, obj.type, obj.id, obj.resource, serverHandler, function(error, result) {
                should.not.exist(error);

                async.series([
                    async.apply(lwm2mClient.registry.setAttribute, obj.uri, obj.resource, 21),
                    async.apply(lwm2mClient.registry.setAttribute, obj.uri, obj.resource, 89),
                    async.apply(lwm2mClient.registry.setAttribute, obj.uri, obj.resource, 7)
                ], function (error) {
                    should.not.exist(error);
                })
            });
        });

        it('should appear in the list of observed values');
    });

    describe('When the client cancels an observed value', function() {
        it('should cease sending messages to the remote server');
    });
});
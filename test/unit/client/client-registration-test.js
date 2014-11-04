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
    lwm2mServer = require('../../../').server,
    lwm2mClient = require('../../../').client,
    config = require('../../../config');


describe('Client-initiated registration', function() {
    beforeEach(function(done) {
        lwm2mServer.start(config, done);
    });
    afterEach(function(done) {
        lwm2mServer.stop(done);
    });

    describe('When the client tries to register in an existent LWTM2M server', function() {
        it('should send a COAP POST Message with the required parameters', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler('registration', function (endpoint, lifetime, version, binding, callback) {
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

            lwm2mClient.register('localhost', config.server.port, 'testEndpoint', function (error) {
                handlerCalled.should.equal(true);
                done();
            });
        });
        it('should pass the returned location to the callback if there is no error');
        it('should send the complete set of supported objects');
    });
    describe('When the client tries to register in an unexistent server', function() {
        it('should raise a SERVER_NOT_FOUND error');
    });
    describe('When the client update method is executed', function() {
        it('should send a COAP UPDATE Message with the required parameters');
        it('should update the set of supported objects');
    });
    describe('When the client unregistration method is executed', function() {
        var deviceInformation;

        beforeEach(function(done) {
            lwm2mServer.setHandler('registration', function (endpoint, lifetime, version, binding, callback) {
                callback(null);
            });
            lwm2mClient.register('localhost', config.server.port, 'testEndpoint', function (error, info) {
                deviceInformation = info;
                done();
            });
        });

        it('should send a COAP DELETE Message to the provided location', function(done) {
            var handlerCalled = false;

            lwm2mServer.setHandler('unregistration', function (device, callback) {
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
});
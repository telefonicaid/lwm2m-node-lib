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
    should = require('should'),
    async = require('async'),
    testInfo = {};

describe('Device registry', function() {
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
                async.apply(utils.registerClient, 'ROOM001'),
                async.apply(utils.registerClient, 'ROOM002')
            ], function (error, results) {
                deviceLocation = results[2];
                done();
            });
        });
    });

    afterEach(function(done) {
        libLwm2m2.stop(testInfo.serverInfo, done);
    });

    describe('When a user executes the List operation of the library on a registry with two records', function () {
        it('both records should appear in the listing returned to the caller', function (done) {
            libLwm2m2.listDevices(function(error, deviceList) {
                should.not.exist(error);
                should.exist(deviceList);
                deviceList.length.should.equal(2);
                done();
            });
        });
    });
    describe('When a user looks for an existing device in the registry by name', function () {
        it('should return the selected device to the caller', function (done) {
            libLwm2m2.getDevice('ROOM002', function(error, device) {
                should.not.exist(error);
                should.exist(device);
                device.name.should.equal('ROOM002');
                done();
            });
        });
    });
    describe('When a user looks for a non-existing device in the registry by name', function () {
        it('should return a DeviceNotFound error to the caller', function (done) {
            libLwm2m2.getDevice('ROOM009', function(error, device) {
                should.exist(error);
                should.not.exist(device);
                error.name.should.equal('DEVICE_NOT_FOUND');
                done();
            });
        });
    });
});
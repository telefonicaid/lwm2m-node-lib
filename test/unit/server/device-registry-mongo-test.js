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
    mongo = require('mongodb').MongoClient,
    should = require('should'),
    async = require('async'),
    testInfo = {},
    iotAgentDb;

describe('MongoDB Device registry', function() {
    var deviceLocation;

    function registerHandlers(callback) {
        libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
            function(endpoint, lifetime, version, binding, payload, innerCb) {
                innerCb();
            });

        callback();
    }

    beforeEach(function (done) {
        config.server.deviceRegistry = {
            type: 'mongodb',
            host: 'localhost',
            port: '27017',
            db: 'lwtm2m'
        };
        libLwm2m2.start(config.server, function (error, srvInfo){
            testInfo.serverInfo = srvInfo;

            async.series([
                libLwm2m2.getRegistry().clean,
                registerHandlers
            ], function (error, results) {
                deviceLocation = results[2];
                mongo.connect('mongodb://localhost:27017/lwtm2m', function(err, db) {
                    iotAgentDb = db;
                    done();
                });
            });
        });
    });

    afterEach(function(done) {
        delete config.server.deviceRegistry;

        iotAgentDb.collection('devices').remove(function(error) {
            iotAgentDb.close(function(error) {
                libLwm2m2.stop(testInfo.serverInfo, done);
            });
        });
    });

    describe('When a registration request arrives to the server', function() {
        it('should insert a new device in the "devices" collection', function(done) {
            utils.registerClient('ROOM001', function (error) {
                iotAgentDb.collection('devices').find({}).toArray(function(err, docs) {
                    should.not.exist(err);
                    should.exist(docs);
                    should.exist(docs.length);
                    docs.length.should.equal(1);
                    done();
                });
            });
        });
        it('should store the device with all its attributes', function(done) {
            utils.registerClient('ROOM001', function (error) {
                iotAgentDb.collection('devices').find({}).toArray(function(err, docs) {
                    should.exist(docs[0]);
                    should.exist(docs[0].path);
                    should.exist(docs[0].lifetime);
                    should.exist(docs[0].type);
                    docs[0].path.should.equal('/rd');
                    docs[0].lifetime.should.equal('86400');
                    docs[0].type.should.equal('Device');
                    done();
                });
            });
        });
    });

    describe('When a user executes the List operation of the library on a registry with two records', function () {
        beforeEach(function (done) {
            async.series([
                async.apply(utils.registerClient, 'ROOM001'),
                async.apply(utils.registerClient, 'ROOM002')
            ], done);
        });

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
        beforeEach(function (done) {
            async.series([
                async.apply(utils.registerClient, 'ROOM001'),
                async.apply(utils.registerClient, 'ROOM002')
            ], done);
        });

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
        beforeEach(function (done) {
            async.series([
                async.apply(utils.registerClient, 'ROOM001'),
                async.apply(utils.registerClient, 'ROOM002')
            ], done);
        });

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

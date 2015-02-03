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
    Readable = require('stream').Readable,
    config = require('../../../config'),
    should = require('should'),
    testInfo = {};

describe('Multiple southbound interfaces', function() {
    function initializeServer(done) {
        config.server.baseRoot = '/theBaseUrl';
        config.server.defaultType = 'Device';
        config.server.types = [
            {
                name: 'Light',
                url: '/light'
            }
        ];
        libLwm2m2.start(config.server, function (error, srvInfo) {
            testInfo.serverInfo = srvInfo;
            done();
        });
    }

    beforeEach(initializeServer);

    afterEach(function(done) {
        delete config.server.types;
        delete config.server.baseRoot;
        libLwm2m2.stop(testInfo.serverInfo, done);
    });

    describe('When a client registration request arrives to a server with a customized Base URL', function() {
        var requestUrl =  {
                host: 'localhost',
                port: config.server.port,
                method: 'POST',
                pathname: '/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should return the  Location-info URL with the prefixed Base URL', function (done) {
            var req = coap.request(requestUrl),
                rs = new Readable(),
                found = false;

            libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
                function(endpoint, lifetime, version, binding, payload, callback) {
                    callback();
                });

            rs.push(payload);
            rs.push(null);
            rs.pipe(req);

            req.on('response', function(res) {
                for (var i = 0; i < res.options.length; i++) {
                    if (res.options[i].name === 'Location-Path') {
                        res.options[i].value.should.match(/\/theBaseUrl.*/);
                        found = true;
                    }
                }

                found.should.equal(true);
                done();
            });
        });
    });
    describe('When a registration targets a type URL', function() {
        var requestUrl =  {
                host: 'localhost',
                port: config.server.port,
                method: 'POST',
                pathname: '/light/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should return the Location-info URL with the prefixed type URL', function (done) {
            var req = coap.request(requestUrl),
                rs = new Readable();

            libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
                function(endpoint, lifetime, version, binding, payload, callback) {
                    callback();
                });

            rs.push(payload);
            rs.push(null);
            rs.pipe(req);

            req.on('response', function(res) {
                res.code.should.equal('2.01');

                libLwm2m2.getRegistry().getByName('ROOM001', function(error, device) {
                    should.not.exist(error);
                    should.exist(device.type);
                    device.type.should.equal('Light');
                    done();
                });
            });
        });
    });
    describe('When a registration targets an unexistent type', function() {
        var requestUrl =  {
                host: 'localhost',
                port: config.server.port,
                method: 'POST',
                pathname: '/pressure/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should return the Location-info URL with the prefixed type URL', function (done) {
            var req = coap.request(requestUrl),
                rs = new Readable();

            libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
                function(endpoint, lifetime, version, binding, payload, callback) {
                    callback();
                });

            rs.push(payload);
            rs.push(null);
            rs.pipe(req);

            req.on('response', function(res) {
                res.code.should.equal('4.04');
                should.exist(res.payload);
                res.payload.toString('utf8').should.equal('TYPE_NOT_FOUND');

                done();
            });
        });
    });
    describe('When a registration targets a type and there is not a type array configured', function() {
        it('should return an TYPE_NOT_FOUND error');
    });
    describe('When a registration targets the default URL and there is not a default type configured', function() {
        var requestUrl =  {
                host: 'localhost',
                port: config.server.port,
                method: 'POST',
                pathname: '/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        beforeEach(function() {
            delete config.server.defaultType;
        });

        afterEach(function() {
            config.server.defaultType = 'Device';
        });

        it('should return a TYPE_NOT_FOUND error', function (done) {
            var req = coap.request(requestUrl),
                rs = new Readable();

            libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
                function(endpoint, lifetime, version, binding, payload, callback) {
                    callback();
                });

            rs.push(payload);
            rs.push(null);
            rs.pipe(req);

            req.on('response', function(res) {
                res.code.should.equal('4.04');
                should.exist(res.payload);
                res.payload.toString('utf8').should.equal('TYPE_NOT_FOUND');

                done();
            });
        });
    });
    describe('When a server is started with a type url of "/rd"', function() {
        beforeEach(function(done) {
            config.server.types = [
                {
                    name: 'Reductioner',
                    url: '/rd'
                }
            ];
            libLwm2m2.stop(testInfo.serverInfo, done);
        });

        afterEach(initializeServer);

        it('should raise an ILLEGAL_TYPE_URL exception', function(done) {
            libLwm2m2.start(config.server, function (error, srvInfo) {
                should.exist(error);
                error.name.should.equal('ILLEGAL_TYPE_URL');
                done();
            });
        });
    });
});

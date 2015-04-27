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
    coapUtils = require('../../../lib/services/coapUtils'),
    libcoap = require('coap'),
    should = require('should'),
    server = libcoap.createServer({type: config.server.ipProtocol}),
    async = require('async'),
    testInfo = {};

describe('Device management interface' , function() {
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

    beforeEach(function (done) {
        libLwm2m2.start(config.server, function (error, srvInfo){
            testInfo.serverInfo = srvInfo;

            async.series([
                registerHandlers,
                async.apply(utils.registerClient, 'ROOM001')
            ], function (error, results) {
                deviceLocation = results[1][0];

                server.listen(results[1][1], function (error) {
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

            libLwm2m2.discover(deviceLocation.split('/')[1], '6', '2', '5', function (error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('The Read content');
                done();
            });
        });
    });
    describe('When the user invokes the Read operation on an instance', function() {
        it('should send a COAP GET Operation to the instance URI');
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

            libLwm2m2.write(deviceLocation.split('/')[1], '6', '2', '5', 'The value', function (error) {
                should.not.exist(error);
                data.should.equal('The value');
                done();
            });
        });
    });
    describe('When the user invokes the Write operation for an instance without specifiying an attribute', function() {
        it('should send a COAP PUT Operation with the full description of the instance as the payload to the instance');
    });
    describe('When the user invokes the Execute operation on a resource', function() {
        it('should send a COAP POST Operation on the selected resource', function(done) {
            var data = '';

            server.on('request', function (req, res) {
                req.method.should.equal('POST');
                res.code = '2.04';

                data = res._request.payload.toString();
                res.end('The content');
            });

            libLwm2m2.execute(deviceLocation.split('/')[1], '6', '2', '5', 'The Arguments', function (error) {
                should.not.exist(error);
                data.should.equal('The Arguments');
                done();
            });
        });
    });
    describe('When the user invokes the Execute operation on an unexistent resource', function() {
        it('should return a OBJECT_NOT_FOUND error to the caller', function(done) {
            server.on('request', function (req, res) {
                res.code = '4.04';

                res.end('The content');
            });

            libLwm2m2.execute(deviceLocation.split('/')[1], '6', '2', '5', 'The Arguments', function (error) {
                should.exist(error);
                error.name.should.equal('OBJECT_NOT_FOUND');
                error.code.should.equal('4.04');
                done();
            });
        });
    });
    describe('When the user invokes the Execute and the server returns an unknown error', function() {
        it('should return a CLIENT_ERROR error to the caller', function(done) {
            server.on('request', function (req, res) {
                res.code = '5.07';

                res.end('The content');
            });

            libLwm2m2.execute(deviceLocation.split('/')[1], '6', '2', '5', 'The Arguments', function (error) {
                should.exist(error);
                error.name.should.equal('CLIENT_ERROR');
                error.code.should.equal('5.07');
                done();
            });
        });
    });
    describe('When the user invokes the Discovery operation on a resource', function() {
        it('should send a COAP GET Operation on the selected resource ' +
            'with the Accept: application/link-format header', function (done) {
            server.on('request', function (req, res) {
                should.exist(req.headers['Accept']);
                req.headers['Accept'].should.equal('application/link-format');
                req.method.should.equal('GET');
                res.code = '2.05';
                req.url.should.equal('/6/2/5');
                res.end('</6/2/5>;pmin=10;pmax=60;lt=42.2');
            });

            libLwm2m2.discover(deviceLocation.split('/')[1], '6', '2', '5', function (error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('</6/2/5>;pmin=10;pmax=60;lt=42.2');
                done();
            });
        });
    });
    describe('When the user invokes the Discovery operation on an object instance', function() {
        it('should send a COAP GET Operation on the selected object instance ' +
        'with the Accept: application/link-format header', function (done) {
            server.on('request', function (req, res) {
                should.exist(req.headers['Accept']);
                req.headers['Accept'].should.equal('application/link-format');
                req.method.should.equal('GET');
                res.code = '2.05';
                req.url.should.equal('/6/2');
                res.end('</6/2>;pmin=10;pmax=60;lt=42.2,</6/2/1>');
            });

            libLwm2m2.discover(deviceLocation.split('/')[1], '6', '2', function (error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('</6/2>;pmin=10;pmax=60;lt=42.2,</6/2/1>');
                done();
            });
        });
    });
    describe('When the user invokes the Discovery operation on an object type', function() {
        it('should send a COAP GET Operation on the selected object type ' +
        'with the Accept: application/link-format header', function (done) {
            server.on('request', function (req, res) {
                should.exist(req.headers['Accept']);
                req.headers['Accept'].should.equal('application/link-format');
                req.method.should.equal('GET');
                req.url.should.equal('/6');
                res.code = '2.05';
                res.end('</6>;pmin=10;pmax=60;lt=42.2,</6//1>');
            });

            libLwm2m2.discover(deviceLocation.split('/')[1], '6', function (error, result) {
                should.not.exist(error);
                should.exist(result);
                result.should.equal('</6>;pmin=10;pmax=60;lt=42.2,</6//1>');
                done();
            });
        });
    });

    describe('When the user invokes the Write Attributes operation over a resource', function() {
        it('should send a COAP PUT Operation on the selected attribute ' +
            'with the given parameters and without payload', function (done) {
            var attributes= {
                    pmin: 5000,
                    pmax: 20000,
                    gt: 14.5,
                    lt: 3.1,
                    st: 2000,
                    cancel: false
                },
                requestSent = false;

            server.on('request', function (req, res) {
                var queryParams = coapUtils.extractQueryParams(req);

                should.exist(queryParams);
                queryParams.pmin.should.equal('5000');
                queryParams.pmax.should.equal('20000');
                queryParams.gt.should.equal('14.5');
                queryParams.lt.should.equal('3.1');
                queryParams.st.should.equal('2000');
                queryParams.cancel.should.equal('false');

                requestSent = true;

                req.method.should.equal('PUT');
                res.code = '2.04';
                res.end('The content');
            });

            libLwm2m2.writeAttributes(deviceLocation.split('/')[1], '6', '2', '5', attributes, function (error) {
                should.not.exist(error);
                requestSent.should.equal(true);
                done();
            });
        });
    });
    describe('When the user invokes the Write Attributes operation with unsupported attributes', function() {
        it('should fail with an UNRECOGNIZED_ATTRIBUTE error', function() {
            it('should send a COAP PUT Operation on the selected attribute ' +
                'with the given parameters and without payload', function (done) {
                var attributes= {
                        pmin: 5000,
                        unexistentAttribute1: 20000,
                        unexistentAttribute2: 14.5,
                        lt: 3.1,
                        st: 2000,
                        cancel: false
                    },
                    requestSent = false;

                server.on('request', function (req, res) {
                    requestSent = true;

                    req.method.should.equal('PUT');
                    res.code = '2.04';
                    res.end('The content');
                });

                libLwm2m2.writeAttributes(deviceLocation.split('/')[1], '6', '2', '5', attributes, function (error) {
                    should.exist(error);
                    error.name.should.equal('UNRECOGNIZED_ATTRIBUTE');
                    requestSent.should.equal(false);
                    done();
                });
            });
        });
    });
    describe('When the user invokes the Create operation on an instance', function() {
        it('should send a COAP POST Operation to the selected Object ID and Instance ID', function (done) {
            var requestArrived = false;

            server.on('request', function (req, res) {
                req.method.should.equal('POST');
                res.code = '2.01';
                req.url.should.equal('/6/3');
                requestArrived = true;
                res.end('The Read content');
            });

            libLwm2m2.create(deviceLocation.split('/')[1], '6', '3', function (error) {
                should.not.exist(error);
                requestArrived.should.equal(true);
                done();
            });
        });
    });
    describe('When the user invokes the Delete operation on an instance', function() {
        it('should send a COAP DELETE Operation to the selected Object ID and Instance ID');
    });
});
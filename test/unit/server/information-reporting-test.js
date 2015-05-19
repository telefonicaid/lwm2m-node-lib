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
    memoryRegistry = require('../../../lib/services/server/inMemoryDeviceRegistry'),
    libcoap = require('coap'),
    should = require('should'),
    server = libcoap.createServer({type: config.server.ipProtocol}),
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

    function emptyHandler(data) {

    }

    beforeEach(function (done) {
        memoryRegistry.clean(function () {
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

    describe('When the user invokes the Observe operation on a resource', function() {
        it('should send a COAP GET Request with a generated Observe Option for the resource',
            function (done) {
                server.on('request', function (req, res) {
                    req.method.should.equal('GET');
                    req.options.should.containDeep([{name: 'Observe'}]);
                    res.code = '2.05';
                    res.setOption('Observe', 1);
                    res.end('The Read content');
                });

                libLwm2m2.observe(deviceLocation.split('/')[1], '6', '2', '5', emptyHandler, function (error, result) {
                    should.not.exist(error);
                    should.exist(result);
                    result.should.equal('The Read content');
                    done();
                });
        });
        it('should store the subscription to the value', function (done) {
            server.on('request', function (req, res) {
                res.code = '2.05';
                res.setOption('Observe', 1);
                res.end('The Read content');
            });

            libLwm2m2.observe(deviceLocation.split('/')[1], '6', '2', '5', emptyHandler, function (error, result) {
                should.not.exist(error);

                libLwm2m2.listObservers(function (error, result) {
                    should.not.exist(error);
                    result.length.should.equal(1);
                    result[0].resource.should.equal('/6/2/5');
                    result[0].deviceId.should.equal(deviceLocation.split('/')[1]);
                    done();
                });
            });
        });
    });
    describe('When a Notify message arrives with an Observe Option', function() {
        beforeEach(function () {
            server.on('request', function (req, res) {
                res.code = '2.05';
                res.setOption('Observe', 1);
                res.write('The First content');
                res.write('The Second content');
                res.write('The Third content');
                res.end('The final content');
            });
        });

        it('should invoke the user notification handler once per notify message', function (done) {
            var handlerInvokedTimes = 0;

            function userHandler(data) {
                handlerInvokedTimes++;

                if (data === 'The final content') {
                    handlerInvokedTimes.should.equal(3);
                    done();
                }
            }

            libLwm2m2.observe(deviceLocation.split('/')[1], '6', '2', '5', userHandler, function (error, result) {
                should.not.exist(error);
            });
        });
    });
    describe.skip('When the user invokes the Cancel operation on a resource', function() {
        beforeEach(function () {
            server.on('request', function (req, res) {
                function notify(msg) {
                    try {
                        res.write(msg);
                    } catch(e) {
                        // Expected to throw an error if the server closes the connection first.
                    }
                }
                res.code = '2.05';
                res.setOption('Observe', 1);

                res.write('The First content');
                setTimeout(notify.bind(null, 'The Second content'), 100);
                setTimeout(notify.bind(null, 'The Third content'), 200);
                setTimeout(notify.bind(null, 'The Fourth content'), 300);
                setTimeout(notify.bind(null, 'The Fifth content'), 400);
            });
        });

        it('should stop sending updates for the resource value', function (done) {
            var handlerInvokedTimes = 0,
                maxTestDuration = 1500;

            function userHandler(data) {
                handlerInvokedTimes++;

                if (handlerInvokedTimes === 1) {
                    libLwm2m2.cancelObserver(deviceLocation.split('/')[1], '6', '2', '5', function () {
                        setTimeout(function () {
                            handlerInvokedTimes.should.equal(1);
                            done();
                        }, maxTestDuration);
                    });
                }
            }

            libLwm2m2.observe(deviceLocation.split('/')[1], '6', '2', '5', userHandler, function (error, result) {
                should.not.exist(error);
            });
        });

        it('should remove the listener from the observers list', function (done) {
            var handlerInvokedTimes = 0;

            function userHandler(data) {
                handlerInvokedTimes++;
            }

            libLwm2m2.observe(deviceLocation.split('/')[1], '6', '2', '5', userHandler, function (error, result) {
                should.not.exist(error);

                libLwm2m2.cancelObserver(deviceLocation.split('/')[1], '6', '2', '5', function () {
                        libLwm2m2.listObservers(function (error, result) {
                            should.not.exist(error);
                            result.length.should.equal(0);
                            done();
                        });
                });
            });
        });
    });
});
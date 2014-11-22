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
    utils = require('./../testUtils'),
    should = require('should'),
    testInfo = {};

describe('Multiple southbound interfaces', function() {
    beforeEach(function (done) {
        config.server.baseRoot = '/theBaseUrl';
        libLwm2m2.start(config.server, function (error, srvInfo) {
            testInfo.serverInfo = srvInfo;
            done();
        });
    });

    afterEach(function(done) {
        delete config.server.type;
        libLwm2m2.stop(testInfo.serverInfo, done);
    });

    describe.only('When a client registration request arrives to a server with a customized Base URL', function() {
        var requestUrl =  {
                host: 'localhost',
                port: config.server.port,
                method: 'POST',
                pathname: '/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should return the response URL with the prefixed Base URL', function (done) {
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
});

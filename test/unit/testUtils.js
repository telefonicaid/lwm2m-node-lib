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

/*jshint unused:false */

var libLwm2m2 = require('../..').server,
    coap = require('coap'),
    Readable = require('stream').Readable,
    config = require('../../config'),
    should = require('should'),
    localhost;

function checkCode(testInfo, requestUrl, payload, code) {
    return function (done) {
        var agent = new coap.Agent({type: config.server.ipProtocol}),
            req = agent.request(requestUrl),
            rs = new Readable();

        if (config.server.ipProtocol === 'udp6') {
            localhost = '::1';
        } else {
            localhost = '127.0.0.1';
        }

        libLwm2m2.setHandler(testInfo.serverInfo, 'registration',
            function(endpoint, lifetime, version, binding, payload, callback) {
                callback();
            });

        rs.push(payload);
        rs.push(null);
        rs.pipe(req);

        req.on('response', function(res) {
            res.code.should.equal(code);
            done();
        });
    };
}

function registerClient(deviceName, callback) {
    var rs = new Readable(),
        creationRequest =  {
            host: localhost,
            port: config.server.port,
            method: 'POST',
            pathname: '/rd',
            query: 'ep=' +  deviceName + '&lt=86400&lwm2m=1.0&b=U'
        },
        payload = '</1>, </2>, </3>, </4>, </5>',
        agent = new coap.Agent({type: config.server.ipProtocol}),
        req = agent.request(creationRequest),
        deviceLocation;

    rs.push(payload);
    rs.push(null);
    rs.pipe(req);

    req.on('response', function(res) {
        for (var i = 0; i < res.options.length; i++) {
            if (res.options[i].name === 'Location-Path') {
                deviceLocation = res.options[i].value;
            }
        }

        callback(null, deviceLocation, res.outSocket.port);
    });
}

exports.checkCode = checkCode;
exports.registerClient = registerClient;
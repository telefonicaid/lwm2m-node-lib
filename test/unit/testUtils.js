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

var libLwm2m2 = require('../..'),
    coap = require('coap'),
    Readable = require('stream').Readable,
    should = require('should');

function checkCode(requestUrl, payload, code) {

    return function (done) {
        var req = coap.request(requestUrl),
            rs = new Readable();

        libLwm2m2.setHandler('registration', function(endpoint, lifetime, version, binding, callback) {
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

exports.checkCode = checkCode;
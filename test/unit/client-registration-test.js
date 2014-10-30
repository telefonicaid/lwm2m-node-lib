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

var libLwm2m2 = require('../..'),
    coap = require('coap'),
    Readable = require('stream').Readable,
    utils = require('./testUtils'),
    should = require('should');

describe('Client registration interface tests', function() {
    beforeEach(function (done) {
        libLwm2m2.start(null, done);
    });

    afterEach(function(done) {
        libLwm2m2.stop(done);
    });

    describe('When a client registration requests doesn\'t indicate a endpoint name arrives', function() {
        var requestUrl =  {
                host: 'localhost',
                port: 5683,
                method: 'POST',
                pathname: '/rd',
                query: 'lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should fail with a 4.00 Bad Request', utils.checkCode(requestUrl, payload, '4.00'));
    });
    describe('When a client registration requests doesn\'t indicate a lifetime arrives', function () {
        var requestUrl =  {
                host: 'localhost',
                port: 5683,
                method: 'POST',
                pathname: '/rd',
                query: 'ep=ROOM001&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';


        it('should fail with a 4.00 Bad Request', utils.checkCode(requestUrl, payload, '4.00'));
    });
    describe('When a client registration requests doesn\'t indicate a binding arrives', function () {
        var requestUrl =  {
                host: 'localhost',
                port: 5683,
                method: 'POST',
                pathname: '/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';


        it('should fail with a 4.00', utils.checkCode(requestUrl, payload, '4.00'));
    });
    describe('When a correct client registration requests arrives', function () {
        var requestUrl =  {
                host: 'localhost',
                port: 5683,
                method: 'POST',
                pathname: '/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should return a 2.01 Created code', utils.checkCode(requestUrl, payload, '2.01'));

        it('should invoke the "registration" handler with the parameters', function (done) {
            var req = coap.request(requestUrl),
                rs = new Readable(),
                handlerCalled = false;

            libLwm2m2.setHandler('registration', function(endpoint, lifetime, version, binding, callback) {
                should.exist(endpoint);
                should.exist(lifetime);
                should.exist(version);
                should.exist(binding);
                endpoint.should.equal('ROOM001');
                lifetime.should.equal('86400');
                version.should.equal('1.0');
                binding.should.equal('U');
                handlerCalled = true;

                callback();
            });

            rs.push(payload);
            rs.push(null);
            rs.pipe(req);

            req.on('response', function(res) {
                handlerCalled.should.equal(true);
                done();
            });
        });
        it('should include Location-Path Options in the response', function (done) {
            var req = coap.request(requestUrl),
                rs = new Readable();

            libLwm2m2.setHandler('registration', function(endpoint, lifetime, version, binding, callback) {
                callback();
            });

            rs.push(payload);
            rs.push(null);
            rs.pipe(req);

            req.on('response', function(res) {
                res.options.length.should.equal(1);
                res.options[0].name.should.equal('Location-Path');
                res.options[0].value.should.match(/\/rd\/.*/);
                done();
            });
        });
    });
});

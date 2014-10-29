'use strict';

var libLwm2m2 = require('../..'),
    coap = require('coap'),
    Readable = require('stream').Readable,
    utils = require('./testUtils'),
    should = require('should');

describe('Client registration interface tests', function() {
    describe('When a client registration requests doesn\'t indicate a endpoint name arrives', function () {
        it('should fail with a 4.00 Bad Request');
    });
    describe('When a client registration requests doesn\'t indicate a endpoint name arrives', function () {
        it('should fail with a 4.00 Bad Request if the request doesn\'t indicate a lifetime');
    });
    describe('When a client registration requests doesn\'t indicate a endpoint name arrives', function () {
        it('should fail with a 4.00 Bad Request if the request doesn\'t indicate a binding');
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
        it('should include Location-Path Options in the response');
    });
});

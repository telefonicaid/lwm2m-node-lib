'use strict';

var libLwm2m2 = require('../..'),
    coap = require('coap'),
    Readable = require('stream').Readable,
    utils = require('./testUtils'),
    should = require('should');

describe('Client unregistration interface tests', function() {
    beforeEach(function (done) {
        libLwm2m2.start(null, done);
    });

    afterEach(function(done) {
        libLwm2m2.stop(done);
    });

    describe('When a unregistration for a not registered device arrives', function () {
        it('should return a 4.04 Not found code [Not in the specs]');
    });
    describe('When a correct client unregistration request arrives', function() {
        var requestUrl =  {
                host: 'localhost',
                port: 5683,
                method: 'DELETE',
                pathname: '/rd',
                query: 'ep=ROOM001&lt=86400&lwm2m=1.0&b=U'
            },
            payload = '</1>, </2>, </3>, </4>, </5>';

        it('should remove the device registration');
        it('should return a 2.02 Deleted code');
    });
});
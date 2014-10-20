'use strict';


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
        it('should return a 2.01 Created code');
    });
});

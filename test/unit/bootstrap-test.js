'use strict';


describe('Client initiated boostrap interface tests', function() {
    describe('When a bootstrapping request comes to the server initiated by the client', function () {
        it('should return a 4.00 Bad Request if the request doesn\'t contains the endpoint name');
        it('should return a 2.04 Changed return code if the request is correct');
        it('should write a server object with the short server ID and a lifetime for the registration');
        it('should write a server object with the server binding');
        it('should write a server object with Registration Update Trigger');
    });
});

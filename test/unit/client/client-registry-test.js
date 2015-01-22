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

var objectRegistry = require('../../..').client.registry,
    async = require('async'),
    apply = async.apply,
    should = require('should');

describe('Client registry', function() {
    describe('When a new object with URI "/1/3" is created in the registry', function() {
        beforeEach(function(done) {
            objectRegistry.create('/1/3', done);
        });

        afterEach(function(done) {
            objectRegistry.remove('/1/3', done);
        });

        it('should appear in subsequent listings', function(done) {
            objectRegistry.list(function(error, objectList) {
                var found = false;

                should.not.exist(error);
                should.exist(objectList);

                for (var i = 0; i < objectList.length; i++) {
                    if (objectList[i].objectUri === '/1/3') {
                        found = true;
                    }
                }

                found.should.equal(true);
                done();
            });
        });
        it('should be stored with its ObjectType and ObjectId', function(done) {
            objectRegistry.get('/1/3', function (error, result) {
                should.not.exist(error);
                should.exist(result);
                result.objectType = '1';
                result.objectId = '3';
                result.objectUri = '/1/3';
                done();
            });
        });
    });
    describe('When a new object with an invalid URI "1/2" is created', function () {
        it('should raise a WRONG_OBJECT_URI error', function(done) {
            objectRegistry.create('1/2', function(error, result) {
                should.exist(error);
                should.not.exist(result);
                error.name.should.equal('WRONG_OBJECT_URI');
                done();
            });
        });
    });
    describe('When a non existent object is retrieved from the registry', function() {
        it('should raise a NOT_FOUND error', function(done) {
            objectRegistry.get('/5/8', function(error, result) {
                should.exist(error);
                should.not.exist(result);
                error.name.should.equal('OBJECT_NOT_FOUND');
                done();
            });
        });
    });
    describe('When an attribute is set in an object', function() {
        beforeEach(function(done) {
            async.series([
                apply(objectRegistry.create, '/1/3'),
                apply(objectRegistry.setResource, '/1/3', '5', '123')
            ], done);
        });
        afterEach(function(done) {
            objectRegistry.remove('/1/3', done);
        });

        it('should appear in the object once retrieved', function(done) {
            objectRegistry.get('/1/3', function(error, result) {
                should.exist(result.attributes);
                should.exist(result.attributes['5']);
                result.attributes['5'].should.equal('123');
                done();
            });
        });
    });
    describe('When an attribute is removed from an object', function() {
        beforeEach(function(done) {
            async.series([
                apply(objectRegistry.create, '/1/3'),
                apply(objectRegistry.setResource, '/1/3', '5', '123'),
                apply(objectRegistry.unsetResource, '/1/3', '5')
            ], done);
        });
        afterEach(function(done) {
            objectRegistry.remove('/1/3', done);
        });

        it('shouldn\'t appear in the retrieved object', function(done) {
            objectRegistry.get('/1/3', function(error, result) {
                should.exist(result.attributes);
                should.not.exist(result.attributes['5']);
                done();
            });
        });
    });
    describe('When multiple objects are created', function() {
        beforeEach(function(done) {
            async.series([
                apply(objectRegistry.create, '/1/3'),
                apply(objectRegistry.create, '/4/8'),
                apply(objectRegistry.create, '/9/13')
            ], done);
        });
        afterEach(function(done) {
            async.series([
                apply(objectRegistry.remove, '/1/3'),
                apply(objectRegistry.remove, '/4/8'),
                apply(objectRegistry.remove, '/9/13')
            ], done);
        });
        it('all the objects should appear in subsequent listings', function(done) {
            objectRegistry.list(function(error, objList) {
                should.not.exist(error);
                should.exist(objList);
                objList.length.should.equal(3);
                done();
            });
        });
    });
    describe('When an object is removed from the registry', function() {
        beforeEach(function(done) {
            async.series([
                apply(objectRegistry.create, '/1/3'),
                apply(objectRegistry.remove, '/1/3')
            ], done);
        });
        afterEach(function(done) {
            objectRegistry.remove('/1/3', function (error) {
                done();
            });
        });

        it('should not appear in the listings any more', function(done) {
            objectRegistry.list(function(error, objectList) {
                var found = false;

                should.not.exist(error);
                should.exist(objectList);

                for (var i = 0; i < objectList.length; i++) {
                    if (objectList[i].objectUri === '/1/3') {
                        found = true;
                    }
                }

                found.should.equal(false);
                done();
            });
        });
        it('should raise an OBJECT_NOT_FOUND error when tried to be retrieved', function(done) {
            objectRegistry.get('/1/3', function(error, result) {
                should.exist(error);
                should.not.exist(result);
                error.name.should.equal('OBJECT_NOT_FOUND');
                done();
            });
        });
    });
});
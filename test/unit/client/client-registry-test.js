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

describe('Client registry', function() {
    describe('When a new object with URI "/1/3" is created in the registry', function() {
        it('should appear in subsequent listings');
    });
    describe('When a new object with an invalid URI "1/2" is created', function () {
        it('should raise a WRONG_OBJECT_URI error');
    });
    describe('When an existent object is retrieved from the registry', function() {
        it('should return the object with its ObjectType and ObjectId');
    });
    describe('When a non existent object is retrieved from the registry', function() {
        it('should raise a NOT_FOUND error');
    });
    describe('When an attribute is set in an object', function() {
        it('should appear in the object once retrieved');
    });
    describe('When an attribute is removed from an object', function() {
        it('shouldn\'t appear in the retrieved object');
    });
    describe('When multiple objects are created', function() {
        it('all the objects should appear in subsequent listings');
    });
});
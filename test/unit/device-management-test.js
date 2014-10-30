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

describe('Device management interface' , function() {
    describe('When the user invokes the Read operation on an attribute', function() {
        it('should send a COAP GET Operation on the selected attribute');
    });
    describe('When the user invokes the Write operation on an attribute', function() {
        it('should send a COAP PUT Operation on the selected attribute');
    });
    describe('When the user invokes the Execute operation on an attribute', function() {
        it('should send a COAP POST Operation on the selected attribute');
    });
    describe('When the user invokes the Attributes operation on an attribute', function() {
        it('should send a COAP PUT Operation on the selected attribute with the appropriate parameters');
    });
});
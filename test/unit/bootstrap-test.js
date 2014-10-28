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

describe('Client initiated boostrap interface tests', function() {
    describe('When a bootstrapping request comes to the server initiated by the client', function () {
        it('should return a 4.00 Bad Request if the request doesn\'t contains the endpoint name');
        it('should return a 2.04 Changed return code if the request is correct');
        it('should write a server object with the short server ID and a lifetime for the registration');
        it('should write a server object with the server binding');
        it('should write a server object with Registration Update Trigger');
    });
});

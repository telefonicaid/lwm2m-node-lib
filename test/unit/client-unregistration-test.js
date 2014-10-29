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

var libLwm2m2 = require('../..');

describe('Client unregistration interface tests', function() {
    beforeEach(function (done) {
        libLwm2m2.start(null, done);
    });

    afterEach(function(done) {
        libLwm2m2.stop(done);
    });

    describe('When a unregistration for a not registered device arrives', function () {
        it('should return a 4.04 Not found code');
    });
    describe('When a correct client unregistration request arrives', function() {
        it('should remove the device registration');
        it('should return a 2.02 Deleted code');
    });
});
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

var Window = require('../../../lib/services/slidingWindow'),
    assert = require('assert');

describe('Sliding windows test', function() {
    var window;

    beforeEach(function() {
        window = new Window(5);
        for (var i = 0; i < 5; i++) {
            window.push(i);
        }
    });

    describe('When a new value is inserted in the sliding window', function() {
        beforeEach(function() {
            window.push(6);
        });

        it('should be contained in the window', function() {
            assert(window.contains(6));
        });
        it('should remove one of the older values from the window', function() {
            assert(!window.contains(1));
        });
    });
});
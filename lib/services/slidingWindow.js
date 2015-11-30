/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of lwm2m-node-lib
 *
 * lwm2m-node-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * lwm2m-node-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with lwm2m-node-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

'use strict';

function createSlidingWindow(size) {
    var window = {
        data: new Array(size),
        header: 0
    };

    function containNumber(number) {
        if (window.data.indexOf(number) < 0) {
            return false;
        } else {
            return true;
        }
    }

    function pushNumber(number) {
        window.data[window.header] = number;
        window.header = (window.header++)%window.data.length;
    }

    return {
        contains: containNumber,
        push: pushNumber
    };
}

module.exports = createSlidingWindow;
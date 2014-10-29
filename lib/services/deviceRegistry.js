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

var registry = {},
    idCounter = 1,
    errors = require('../errors');

function register(object, callback) {
    var id = idCounter++;
    registry[id] = object;
    callback(null, id);
}

function unregister(id, callback) {
    var obj = registry[id];

    if (obj) {
        delete registry[id];

        callback(null, obj);
    } else {
        callback(new errors.DeviceNotFound(id));
    }
}

function clean(callback) {
    registry = {};

    callback();
}

exports.register = register;
exports.unregister = unregister;
exports.clean = clean;
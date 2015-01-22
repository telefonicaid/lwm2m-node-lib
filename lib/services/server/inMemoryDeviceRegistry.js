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
    errors = require('../../errors'),
    _ = require('underscore');

/**
 * Inserts the given object in the registry. The generated ID is returned through the callback.
 *
 * @param {Object} object       Object to insert into the registry.
 */
function register(object, callback) {
    var id = idCounter++;
    registry[id] = object;
    registry[id].id = id;
    callback(null, id);
}

/**
 * Removes the object identified by this id from the registry. The removed object is passed as the first callback
 * parameter.
 *
 * @param {Integer} id          Identifier of the object to be removed.
 */
function unregister(id, callback) {
    var obj = registry[id];

    if (obj) {
        delete registry[id];

        callback(null, obj);
    } else {
        callback(new errors.DeviceNotFound(id));
    }
}

/**
 * Remove all the objects from the registry.
 */
function clean(callback) {
    registry = {};

    callback();
}

/**
 * Retrieves from the registry the object identified by the given id.
 *
 * @param {String} id       Id of the object to be retrieved.
 */
function getObject(id, callback) {
    if (registry[id]) {
        callback(null, _.clone(registry[id]));
    } else {
        callback(new errors.DeviceNotFound(id));
    }
}

/**
 * Update the object identified with the given id with the object value passed as a parameter.
 *
 * @param {String} id       Id of the object to update.
 * @param {Object} obj      New object value to insert in the registry.
 */
function update(id, obj, callback) {
    if (registry[id]) {
        registry[id] = obj;
        callback(null, registry[id]);
    } else {
        callback(new errors.DeviceNotFound(id));
    }
}

/**
 * Returns an array of all the devices as the parameter of the callback.
 */
function list(callback) {
    var result = [];

    for(var key in registry) {
        if (registry.hasOwnProperty(key)) {
            result.push(registry[key]);
        }
    }

    callback(null, result);
}

/**
 * Gets the device that has the device name passed as a parameter (should be unique) or return a DeviceNotFound error
 * in case none exist.
 *
 * @param {String} deviceName       Name of the device to retrieve.
 */
function getByName(deviceName, callback) {
    var result;

    for(var key in registry) {
        if (registry[key] && registry[key].name === deviceName) {
            result = registry[key];
        }
    }

    if (result) {
        callback(null, result);
    } else {
        callback(new errors.DeviceNotFound(deviceName));
    }
}

/**
 * Initializes the device registry based on the parameter found in the configuration. For this in memory registry this
 * function doesn't do anything.
 *
 * @param {Object} config           Configuration object.
 */
function init(config, callback) {
    callback(null);
}

exports.register = register;
exports.unregister = unregister;
exports.get = getObject;
exports.update = update;
exports.clean = clean;
exports.list = list;
exports.getByName = getByName;
exports.init = init;
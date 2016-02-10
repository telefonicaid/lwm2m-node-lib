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

var registry = {},
    idCounter = 1,
    errors = require('../../errors'),
    _ = require('underscore'),
    logger = require('logops'),
    context = {
        op: 'LWM2MLib.MemoryDeviceRegistry'
    },
    checkLifetimeInterval;

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
 * Inserts the given object in the registry and removes the old registration.
 * The generated ID is returned through the callback.
 *
 * @param {Object} object       Object to insert into the registry.
 */
function register(object, callback) {

    function save(cb) {
        var id = idCounter++;
        registry[id] = object;
        registry[id].id = id;
        return cb(null, id);
    }

    getByName(object.name, function(error, result){
        if (!error && result) {
            unregister(result.id, function(err){
                return save(callback);
            });
        }
        else {
            return save(callback);
        }
    });
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
 * Stops checking for device lifetime.
 */
function stopLifetimeCheck() {
    clearInterval(checkLifetimeInterval);
    checkLifetimeInterval = null;
}

/**
 * If Lifetime Resource exists, then the registration SHOULD be removed by the Server if a new registration or update
 * is not received within this lifetime.
 *
 * @param {Object}   lifetimeCheckInterval           Minimum interval between lifetime checks in ms
 * @param {Function} unregistrationHandler           Unregistration device handler
 */
function checkLifetime(lifetimeCheckInterval, unregistrationHandler) {
    stopLifetimeCheck();

    checkLifetimeInterval = setInterval(function(){
        list(function(error, deviceList){
            if (!error && deviceList) {
                deviceList.forEach(function(device){
                    if (device.lifetime &&
                        new Date() - new Date(device.creationDate) > Number(device.lifetime) * 1000) {
                        unregister(device.id, function(err, obj){
                            if (err) {
                                logger.debug(context,
                                    'Lifetime unregistration for device [%s] ended up in error [%s] with code [%s]',
                                    obj.name, err.name, err.code);
                            }
                            else {
                                logger.debug(context,
                                    'Lifetime unregistration for device [%s] ended successfully',
                                    obj.name);

                                if (unregistrationHandler) {
                                    unregistrationHandler(obj, function(){

                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }, lifetimeCheckInterval);
}

/**
 * Initializes the device registry based on the parameter found in the configuration. For this in memory registry this
 * function doesn't do anything.
 *
 * @param {Object} config           Configuration object.
 */
function init(config, callback) {
    if (config.logLevel) {
        logger.setLevel(config.logLevel);
    }
    callback(null);
}

exports.register = register;
exports.unregister = unregister;
exports.get = getObject;
exports.update = update;
exports.clean = clean;
exports.list = list;
exports.checkLifetime = checkLifetime;
exports.stopLifetimeCheck = stopLifetimeCheck;
exports.getByName = getByName;
exports.init = init;

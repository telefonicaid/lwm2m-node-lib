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

var errors = require('../../errors'),
    dbService = require('../model/dbConn'),
    Device = require('../model/Device'),
    logger = require('logops'),
    context = {
        op: 'LWM2MLib.MomgodbDeviceRegistry'
    },
    checkLifetimeInterval;

/**
 * Generic function to retrieve a device based on a parameter value. This is an auxiliary function meant to abstract
 * all the getBySomething functions.
 *
 * @param {String} parameterName        Name of the parameter that is used to identify the device.
 * @param {String} parameterValue       Value of the parameter to check.
 */
function getByParameter(parameterName, parameterValue, callback) {
    var query,
        filter = {};

    filter[parameterName] = parameterValue;

    query = Device.model.findOne(filter);
    query.select({__v: 0});

    query.exec(function handleGet(error, data) {
        if (error) {
            callback(errors.InternalDbError(error));
        } else if (data) {
            callback(null, data);
        } else {
            callback(new errors.DeviceNotFound(parameterValue));
        }
    });
}

/**
 * Auxiliary function to transform a Mongoose DAO to a plain JS Object as part of the callback process. It returns a
 * function that will invoke the callback passed as a parameter transforming the received model object before.
 */
function toObject(callback) {
    return function (error, result) {
        if (error) {
            callback(error);
        } else {
            callback(null, result.toObject());
        }
    };
}

/**
 * Retrieves from the registry the object identified by the given id.
 *
 * @param {String} id       Id of the object to be retrieved.
 */
function getObject(id, callback) {
    getByParameter('id', id, toObject(callback));
}

/**
 * Gets the device that has the device name passed as a parameter (should be unique) or return a DeviceNotFound error
 * in case none exist.
 *
 * @param {String} deviceName       Name of the device to retrieve.
 */
function getByName(deviceName, callback) {
    getByParameter('name', deviceName, toObject(callback));
}

/**
 * Removes the object identified by this id from the registry. The removed object is passed as the first callback
 * parameter.
 *
 * @param {Integer} id          Identifier of the object to be removed.
 */
function unregister(id, callback) {
    Device.model.findOneAndRemove({ id: id }, function(error, device) {
        if (error) {
            callback(errors.InternalDbError(error));
        } else if (device) {
            callback(null, device.toObject());
        } else {
            callback(new errors.DeviceNotFound(id));
        }
    });
}

/**
 * Inserts the given object in the registry and removes the old registration.
 * The generated ID is returned through the callback.
 *
 * @param {Object} object       Object to insert into the registry.
 */
function register(object, callback) {
    function saveDeviceHandler(error, deviceDAO) {
        if (error) {
            callback(errors.InternalDbError(error));
        } else {
            callback(null, deviceDAO.id);
        }
    }

    function mongoStore(innerCb) {
        var deviceObj = new Device.model();

        deviceObj.address = object.address;
        deviceObj.port = object.port;
        deviceObj.path = object.path;
        deviceObj.lifetime = object.lifetime;
        deviceObj.name = object.name;
        deviceObj.type = object.type;
        deviceObj.creationDate = object.creationDate;

        deviceObj.save(innerCb);
    }

    getByName(object.name, function(error, result){
        if (!error && result) {
            unregister(result.id, function(err){
                return mongoStore(saveDeviceHandler);
            });
        }
        else {
            return mongoStore(saveDeviceHandler);
        }
    });
}

/**
 * Remove all the objects from the registry.
 */
function clean(callback) {
    Device.model.remove({}, function(error, number) {
        if (error) {
            callback(errors.InternalDbError(error));
        } else {
            callback(null);
        }
    });
}

/**
 * Update the object identified with the given id with the object value passed as a parameter.
 *
 * @param {String} id       Id of the object to update.
 * @param {Object} obj      New object value to insert in the registry.
 */
function update(id, obj, callback) {
    getByParameter('id', id, function(error, objDAO) {
        if (error) {
            callback(error);
        } else {
            objDAO.id = obj.id;
            objDAO.address = obj.address;
            objDAO.port = obj.port;
            objDAO.path = obj.path;
            objDAO.lifetime = obj.lifetime;
            objDAO.name = obj.name;
            objDAO.type = obj.type;
            objDAO.creationDate = obj.creationDate;
            objDAO.save(toObject(callback));
        }
    });
}

/**
 * Returns an array of all the devices as the parameter of the callback.
 */
function list(callback) {
    var condition = {},
        query;

    query = Device.model.find(condition).sort();

    query.exec(callback);
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
 * Initializes the device registry based on the parameter found in the configuration. The MongoDB config object should
 * contain at least the host string needed to connect to MongoDB and the database name where to store the device info.
 * The configuration object to use should be the one corresponding to the general server configuration, although all
 * the Mongo specific information should be stored under the 'deviceRegistry' section.
 *
 * @param {Object} config           Configuration object containing a deviceRegistry attribute with the info.
 */
function init(config, callback) {
    if (config.logLevel) {
        logger.setLevel(config.logLevel);
    }
    dbService.init(config.deviceRegistry.host, config.deviceRegistry.db, callback);
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

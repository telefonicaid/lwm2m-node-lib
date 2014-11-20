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

var errors = require('../../errors'),
    dbService = require('../model/dbConn'),
    async = require('async'),
    Device = require('../model/Device'),
    idCounter = 1;


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

function getByName(deviceName, callback) {
    getByParameter('name', deviceName, toObject(callback));
}

/**
 * Inserts the given object in the registry. The generated ID is returned through the callback.
 *
 * @param {Object} object       Object to insert into the registry.
 */
function register(object, callback) {
    function getId(innerCb) {
        innerCb(null, idCounter++);
    }

    function saveDeviceHandler(error, deviceDAO) {
        if (error) {
            callback(errors.InternalDbError(error));
        } else {
            callback(null, deviceDAO.toObject());
        }
    }

    function mongoStore(id, innerCb) {
        var deviceObj = new Device.model();

        deviceObj.id = id;
        deviceObj.address = object.address;
        deviceObj.lifetime = object.lifetime;
        deviceObj.name = object.name;


        deviceObj.save(innerCb);
    }

    async.waterfall([
        getId,
        mongoStore
    ], saveDeviceHandler);
}

/**
 * Removes the object identified by this id from the registry. The removed object is passed as the first callback
 * parameter.
 *
 * @param {Integer} id          Identifier of the object to be removed.
 */
function unregister(id, callback) {
    Device.model.remove({ id: id }, function(error, number) {
        if (error) {
            callback(errors.InternalDbError(error));
        } else if (number === 1) {
            callback(null);
        } else {
            callback(errors.DeviceNotFound(id));
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
    getObject(id, function(error, objDAO) {
        if (error) {
            callback(error);
        } else {
            objDAO.id = obj.id;
            objDAO.type = objDAO.type;
            objDAO.save(callback);
        }
    });
}

function list(callback) {
    var condition = {},
        query;

    query = Device.model.find(condition).sort();

    query.exec(callback);
}

function init(newConfig, callback) {
    dbService.init(newConfig.deviceRegistry.host, newConfig.deviceRegistry.db, callback);
}

exports.register = register;
exports.unregister = unregister;
exports.get = getObject;
exports.update = update;
exports.clean = clean;
exports.list = list;
exports.getByName = getByName;
exports.init = init;
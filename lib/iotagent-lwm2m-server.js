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

var coapRouter = require('./services/coapRouter'),
    errors = require('./errors'),
    registry,
    deviceManagement = require('./services/server/deviceManagement'),
    async = require('async'),
    logger = require('logops'),
    apply = async.apply;

/**
 * Load the internal handlers for each kind of operation. Each handler is implemented in a separated module. This
 * module will be, in time, in charge of executing the user handler for that operation with all the data extracted
 * from the request (and completed with internal data if needed).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadDefaultHandlers(serverInfo, config) {
    logger.info('Loading default handlers');

    serverInfo.handlers = {
        registration: {
            module: require('./services/server/registration'),
            user: coapRouter.defaultHandler
        },
        unregistration: {
            module: require('./services/server/unregistration'),
            user: coapRouter.defaultHandler
        },
        updateRegistration: {
            module: require('./services/server/updateRegistration'),
            user: coapRouter.defaultHandler
        }
    };

    for (var i in serverInfo.handlers) {
        if (serverInfo.handlers.hasOwnProperty(i)) {
            serverInfo.handlers[i].module.init(registry, config);
            serverInfo.handlers[i].lib = serverInfo.handlers[i].module.handle;
        }
    }
}

/**
 * Load the tables of available routes. For each route, the method, a regexp for the path and the name of the operation
 * is indicated (the name of the operation will be used to select the internal and user handlers to execute for each
 * route).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadRoutes(serverInfo) {
    logger.info('Loading routes');

    serverInfo.routes = [
        ['POST', /\/rd/, 'registration'],
        ['DELETE', /\/rd\/.*/, 'unregistration'],
        ['PUT', /\/rd\/.*/, 'updateRegistration']
    ];
}

function validateTypes(config, callback) {
    var error;

    logger.info('Validating configuration types');

    if (config.types) {
        for (var i in config.types) {
            if (config.types[i].url.match(/^\/rd.*/)) {
                error = new errors.IllegalTypeUrl(config.types[i].url);
            }
        }
    }

    callback(error);
}

function start(config, startCallback) {
    function loadDefaults(serverInfo, callback) {
        loadRoutes(serverInfo);
        loadDefaultHandlers(serverInfo, config);
        callback(null, serverInfo);
    }

    if (config.logLevel) {
        logger.setLevel(config.logLevel);
    }

    logger.info('Starting Lightweight M2M Server');

    if (config.deviceRegistry && config.deviceRegistry.type === 'mongodb') {
        logger.info('Mongo DB Device registry selected for Lightweight M2M Library');
        registry = require('./services/server/mongodbDeviceRegistry');
    } else {
        logger.info('Memory Device registry selected for Lightweight M2M Library');
        registry = require('./services/server/inMemoryDeviceRegistry');
    }

    exports.listDevices = registry.list;
    exports.getDevice = registry.getByName;

    async.waterfall([
        apply(validateTypes, config),
        apply(registry.init, config),
        registry.clean,
        apply(coapRouter.start, config),
        loadDefaults
    ], startCallback);
}

function getRegistry() {
    return registry;
}

exports.start = start;
exports.setHandler = coapRouter.setHandler;
exports.stop = coapRouter.stop;
exports.read = deviceManagement.read;
exports.write = deviceManagement.write;
exports.execute = deviceManagement.execute;
exports.writeAttributes = deviceManagement.writeAttributes;
exports.discover = deviceManagement.discover;
exports.create = deviceManagement.create;
exports.remove = deviceManagement.remove;
exports.getRegistry = getRegistry;


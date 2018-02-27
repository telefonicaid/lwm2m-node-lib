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

var coapRouter = require('./services/coapRouter'),
    errors = require('./errors'),
    registry,
    deviceManagement = require('./services/server/deviceManagement'),
    informationReporting = require('./services/server/informationReporting'),
    coapUtils = require('./services/server/coapUtils'),
    async = require('async'),
    logger = require('logops'),
    context = {
        op: 'LWM2MLib.Server'
    },
    apply = async.apply,
    config,
    status = 'STOPPED';

/**
 * Load the internal handlers for each kind of operation. Each handler is implemented in a separated module. This
 * module will be, in time, in charge of executing the user handler for that operation with all the data extracted
 * from the request (and completed with internal data if needed).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadDefaultHandlers(serverInfo, config) {
    logger.info(context, 'Loading default handlers');

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
    logger.info(context, 'Loading routes');

    serverInfo.routes = [
        ['POST', /\/rd$/, 'registration'],
        ['DELETE', /\/rd\/.*/, 'unregistration'],
        ['POST', /\/rd\/.*/, 'updateRegistration']
    ];
}

function validateTypes(config, callback) {
    var error;

    logger.info(context, 'Validating configuration types');

    if (config.types) {
        for (var i in config.types) {
            if (config.types[i].url.match(/^\/rd.*/)) {
                error = new errors.IllegalTypeUrl(config.types[i].url);
            }
        }
    }

    callback(error);
}

function start(serverConfig, startCallback) {
    function loadDefaults(serverInfo, callback) {
        loadRoutes(serverInfo);
        loadDefaultHandlers(serverInfo, config);
        callback(null, serverInfo);
    }

    config = serverConfig;
    if (config.logLevel) {
        logger.setLevel(config.logLevel);
    }

    logger.info(context, 'Starting Lightweight M2M Server');

    if (config.deviceRegistry && config.deviceRegistry.type === 'mongodb') {
        logger.info(context, 'Mongo DB Device registry selected for Lightweight M2M Library');
        registry = require('./services/server/mongodbDeviceRegistry');
    } else {
        logger.info(context, 'Memory Device registry selected for Lightweight M2M Library');
        registry = require('./services/server/inMemoryDeviceRegistry');
    }

    deviceManagement.init(registry, config);
    informationReporting.init(registry, config);
    coapUtils.init(config);

    exports.listDevices = registry.list;
    exports.getDevice = registry.getByName;

    async.waterfall([
        apply(validateTypes, config),
        apply(registry.init, config),
        apply(coapRouter.start, config),
        loadDefaults
    ], function (error, results) {
        if (error) {
            status = 'ERROR';
        } else {
            status = 'RUNNING';
            registry.checkLifetime(config.lifetimeCheckInterval);
        }

        startCallback(error, results);
    });
}

function stop(deviceInfo, callback) {
    status = 'STOPPED';

    async.series([
        informationReporting.clean,
        apply(coapRouter.stop, deviceInfo)
    ], callback);
}

function getRegistry() {
    return registry;
}

function isRunning() {
    return status === 'RUNNING';
}

/**
 * Sets the handler callback for a given type of operation.
 *
 * The signature of the handler will depend on the operation being handled. The complete list of operations and the
 * signature of its handlers can be found in the online documentation.
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 * @param {String} type         Name of the operation to be handled.
 * @param {Function} handler    Operation handler.
 */
function setHandler(serverInfo, type, handler) {
    coapRouter.setHandler(serverInfo, type, handler);

    if (type === 'unregistration') {
        registry.checkLifetime(config.lifetimeCheckInterval, handler);
    }
}

exports.start = start;
exports.setHandler = setHandler;
exports.stop = stop;
exports.read = deviceManagement.read;
exports.write = deviceManagement.write;
exports.execute = deviceManagement.execute;
exports.writeAttributes = deviceManagement.writeAttributes;
exports.discover = deviceManagement.discover;
exports.create = deviceManagement.create;
exports.remove = deviceManagement.remove;
exports.observe = informationReporting.observe;
exports.listObservers = informationReporting.list;
exports.cleanObservers = informationReporting.clean;
exports.cancelObserver = informationReporting.cancel;
exports.buildObserverId = informationReporting.buildId;
exports.parseObserverId = informationReporting.parseId;
exports.getRegistry = getRegistry;
exports.isRunning = isRunning;


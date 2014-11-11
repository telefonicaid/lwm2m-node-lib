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
    registry = require('./services/server/deviceRegistry'),
    deviceManagement = require('./services/server/deviceManagement');

/**
 * Load the internal handlers for each kind of operation. Each handler is implemented in a separated module. This
 * module will be, in time, in charge of executing the user handler for that operation with all the data extracted
 * from the request (and completed with internal data if needed).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadDefaultHandlers(serverInfo) {
    serverInfo.handlers = {
        registration: {
            lib: require('./services/server/registration').handle,
            user: coapRouter.defaultHandler
        },
        unregistration: {
            lib: require('./services/server/unregistration').handle,
            user: coapRouter.defaultHandler
        },
        updateRegistration: {
            lib: require('./services/server/updateRegistration').handle,
            user: coapRouter.defaultHandler
        }
    };
}

/**
 * Load the tables of available routes. For each route, the method, a regexp for the path and the name of the operation
 * is indicated (the name of the operation will be used to select the internal and user handlers to execute for each
 * route).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadRoutes(serverInfo) {
    serverInfo.routes = [
        ['POST', /\/rd/, 'registration'],
        ['DELETE', /\/rd\/.*/, 'unregistration'],
        ['PUT', /\/rd\/.*/, 'updateRegistration']
    ];
}

function start(config, callback) {
    coapRouter.start(config, function (error, serverInfo) {
        if (error) {
            callback(error);
        } else {
            loadRoutes(serverInfo);
            loadDefaultHandlers(serverInfo);

            registry.clean(function (error) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, serverInfo);
                }
            });
        }
    });
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
exports.listDevices = registry.list;
exports.getDevice = registry.getByName;

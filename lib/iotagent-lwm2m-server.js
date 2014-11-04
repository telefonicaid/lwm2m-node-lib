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

var libcoap = require('coap'),
    registry = require('./services/server/deviceRegistry'),
    deviceManagement = require('./services/server/deviceManagement'),
    server,
    routes,
    handlers;

/**
 * Handles the arrival of a request to the LWTM2M Server. To do so, it loops through the routes table, trying to match
 * the pathname and method of the request to an existing route. If a route matches, and the route has a handler,
 * the handler is invoked with the request, response and user handler for that operation. Otherwise, a 4.04 error is
 * returned.
 *
 * @param {Object} req      Arriving COAP Request.
 * @param {Object} res      COAP response to the client.
 */
function dataHandler(req, res) {
    req.urlObj = require('url').parse(req.url);

    for (var i in routes) {
        if (req.method === routes[i][0] &&
            req.urlObj.pathname.match(routes[i][1]) &&
            handlers[routes[i][2]].user) {
            handlers[routes[i][2]].lib(req, res, handlers[routes[i][2]].user);
            return;
        }
    }

    res.code = '4.04';
    res.end('');
}

/**
 * Load the internal handlers for each kind of operation. Each handler is implemented in a sepparated module. This
 * module will be, in time, in charge of executing the user handler for that operation with all the data extracted
 * from the request (and completed with internal data if needed).
 */
function loadDefaultHandlers() {
    handlers = {
        registration: {
            lib: require('./services/server/registration').handle,
            user: null
        },
        unregistration: {
            lib: require('./services/server/unregistration').handle,
            user: null
        },
        updateRegistration: {
            lib: require('./services/updateRegistration').handle,
            user: null
        }
    };
}

/**
 * Load the tables of available routes. For each route, the method, a regexp for the path and the name of the operation
 * is indicated (the name of the operation will be used to select the internal and user handlers to execute for each
 * route).
 */
function loadRoutes() {
    routes = [
        ['POST', /\/rd/, 'registration'],
        ['DELETE', /\/rd\/.*/, 'unregistration'],
        ['PUT', /\/rd\/.*/, 'updateRegistration']
    ];
}

/**
 * Start the Lightweight M2M Server. This server module is a singleton, no multiple instances can be started (invoking
 * start multiple times without invoking stop can have unexpected results).
 *
 * @param {Object} config       Configuration object including all the information needed for starting the server.
 */
function startCoap(config, callback) {
    server = libcoap.createServer();

    loadDefaultHandlers();
    loadRoutes();

    server.on('request', dataHandler);

    server.listen(config.server.port, function () {
        registry.clean(callback);
    });
}

/**
 *  Stops the LWTM2M Server.
 */
function stopCoap(callback) {
    server.close(callback);
}

/**
 * Sets the handler callback for a given type of operation. If for a given type no handler is provided, a default
 * dummy handler will be used.
 *
 * The signature of the handler will depend on the operation being handled. The complete list of operations and the
 * signature of its handlers can be found in the online documentation.
 *
 * @param {String} type         Name of the operation to be handled.
 * @param {Function} handler    Operation handler.
 */
function setHandler(type, handler) {
    handlers[type].user = handler;
}

exports.start = startCoap;
exports.setHandler = setHandler;
exports.stop = stopCoap;
exports.read = deviceManagement.read;
exports.write = deviceManagement.write;
exports.execute = deviceManagement.execute;
exports.setAttributes = deviceManagement.setAttributes;
exports.listDevices = registry.list;
exports.getDevice = registry.getByName;

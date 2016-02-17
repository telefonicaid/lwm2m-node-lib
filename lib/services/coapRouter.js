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

var libcoap = require('coap'),
    logger = require('logops'),
    errors = require('../errors'),
    defaultFormats = require('./OMAContentFormats'),
    Window = require('./slidingWindow'),
    context = {
        op: 'LWM2MLib.COAPRouter'
    };

/**
 * Handles the arrival of a request to the LWTM2M Server. To do so, it loops through the routes table, trying to match
 * the pathname and method of the request to an existing route. If a route matches, and the route has a handler,
 * the handler is invoked with the request, response and user handler for that operation. Otherwise, a 4.04 error is
 * returned.
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function dataHandler(serverInfo) {
    return function(req, res) {
        if (req.code === '0.00' && req._packet.confirmable && req.payload.length === 0) {
            res.reset();
        } else if (serverInfo.window.contains(req._packet.messageId)) {
            logger.debug(context, 'Discarding duplicate package [%s] on url [%s] with messageId [%d]',
                req.method, req.url, req._packet.messageId);
        } else {
            serverInfo.window.push(req._packet.messageId);

            logger.debug(context, 'Handling request with method [%s] on url [%s] with messageId [%d]',
                req.method, req.url, req._packet.messageId);

            req.urlObj = require('url').parse(req.url);

            for (var i in serverInfo.routes) {
                if (req.method === serverInfo.routes[i][0] && req.urlObj.pathname.match(serverInfo.routes[i][1])) {
                    serverInfo.handlers[serverInfo.routes[i][2]]
                        .lib(req, res, serverInfo.handlers[serverInfo.routes[i][2]].user);
                    return;
                }
            }
        }
    };
}

function defaultHandler() {
    var callback = null;

    for (var i=0; i < arguments.length; i++) {
        if (arguments[i] instanceof Function) {
            callback = arguments[i];
        }
    }

    callback();
}

/**
 * Load the COAP Content Formats and numbers used in LWM2M.
 */
function loadLightweightM2MFormats(config) {
    var formats;

    if (config.formats) {
        formats = config.formats;
    } else if (defaultFormats && defaultFormats.formats) {
        formats = defaultFormats.formats;
        config.formats = formats;
    } else {
        throw new errors.ContentFormatNotFound();
    }

    if (!config.writeFormat && defaultFormats && defaultFormats.writeFormat) {
        config.writeFormat = defaultFormats.writeFormat;
    }

    for (var i = 0; i < formats.length; i++) {
        libcoap.registerFormat(formats[i].name, formats[i].value);
    }
}

/**
 * Start the Lightweight M2M Server. This server module is a singleton, no multiple instances can be started (invoking
 * start multiple times without invoking stop can have unexpected results).
 *
 * @param {Object} config       Configuration object including all the information needed for starting the server.
 */
function startCoap(config, callback) {
    var serverInfo = {
        server: null,
        routes: [],
        handlers: null
    };

    if (config.udpWindow) {
        serverInfo.window = new Window(config.udpWindow);
    } else {
        serverInfo.window = new Window(100);
    }

    logger.info(context, 'Starting COAP Server on port [%d]', config.port);

    loadLightweightM2MFormats(config);

    serverInfo.server = libcoap.createServer({
        type: config.serverProtocol,
        proxy: true
    });

    serverInfo.server.on('request', dataHandler(serverInfo));

    serverInfo.server.on('error', function(error) {
        logger.error(context, 'An error occurred creating COAP listener: %j', error);
        callback(error);
    });

    serverInfo.server.listen(config.port, function (error) {
        if (error) {
            logger.error(context, 'Couldn\'t start COAP server: %s', error);
        } else {
            logger.info(context, 'COAP Server started successfully');
        }

        callback(error, serverInfo);
    });
}

/**
 *  Stops the LWTM2M Server.
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function stopCoap(serverInfo, callback) {
    logger.info(context, 'Stopping COAP Server');

    if (serverInfo.server) {
        serverInfo.server.close(callback);
    } else {
        logger.error(context, 'Tried to close an unexistent server');
        callback();
    }
}

/**
 * Sets the handler callback for a given type of operation. If for a given type no handler is provided, a default
 * dummy handler will be used.
 *
 * The signature of the handler will depend on the operation being handled. The complete list of operations and the
 * signature of its handlers can be found in the online documentation.
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 * @param {String} type         Name of the operation to be handled.
 * @param {Function} handler    Operation handler.
 */
function setHandler(serverInfo, type, handler) {
    logger.debug(context, 'Setting [%s] handler', type);
    serverInfo.handlers[type].user = handler;
}

exports.start = startCoap;
exports.setHandler = setHandler;
exports.stop = stopCoap;
exports.defaultHandler = defaultHandler;

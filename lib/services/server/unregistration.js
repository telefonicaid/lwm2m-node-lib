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

var async = require('async'),
    logger = require('logops'),
    context = {
        op: 'LWM2MLib.Unregistration'
    },
    registry;

/**
 *  Generates the end of request handler that will generate the final response to the COAP Client.
 */
function endUnregistration(req, res) {
    return function (error, result) {
        if (error) {
            logger.debug(context, 'Registration request ended up in error [%s] with code [%s]',
                error.message, error.code);

            res.code = error.code;
            res.end(error.message);
        } else {
            logger.debug(context, 'Unregistration request ended successfully');

            res.code = '2.02';
            res.end('');
        }
    };
}

/**
 * Parse the pathname of the request to extract the device id and return it through the callback.
 *
 * @param {Object} req           Arriving COAP Request to be processed.
 */
function parsePath(req, callback) {
    var pathElements = req.urlObj.pathname.split('/');

    callback(null, pathElements[2]);
}

/**
 * Invoke the user handler for this operation with the unregistered object as its only argument.
 *
 * @param {Function} handler        User handler for the unregistration.
 * @param {Object} removedObj       The removed Device object.
 */
function applyHandler(handler, removedObj, callback) {
    logger.debug(context, 'Calling user handler for unregistration actions for device [%s]', removedObj.name);

    handler(removedObj, callback);
}

/**
 * Handle the registration operation.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @param {Function} handler    User handler to be executed if everything goes ok.
 */
function handleUnregistration(req, res, handler) {
    logger.debug(context, 'Handling unregistration request');

    async.waterfall([
        async.apply(parsePath, req),
        registry.unregister,
        async.apply(applyHandler, handler)
    ], endUnregistration(req, res));
}

function setRegistry(newRegistry) {
    registry = newRegistry;
}

exports.init = setRegistry;
exports.handle = handleUnregistration;
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

var async = require('async'),
    apply = async.apply,
    objectRegistry = require('./objectRegistry'),
    errors = require('../../errors');


/**
 * Extract Object type, id and payload from the request URI, returning it using the callback.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 */

function extractUriInfo(req, res, callback) {
    if (req.urlObj.pathname.match(/\/\d+\/\d+\/\d+/)) {
        var resourceIndex = req.urlObj.pathname.lastIndexOf('/'),
            resourceId = req.urlObj.pathname.substring(resourceIndex + 1),
            objectUri = req.urlObj.pathname.substring(0, resourceIndex),
            payload = req.payload.toString('utf8');

        callback(null, objectUri, resourceId, payload);
    } else {
        callback(new errors.WrongObjectUri(req.urlObj.pathname));
    }
}

/**
 * Invoke the user handler for this operation, with all the information from the query parameters as its arguments.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Function} handler        User handler to be invoked.
 */
function applyHandler(resourceId, attributeValue, handler, storedObject, callback) {
    handler(storedObject.objectType, storedObject.objectId, resourceId, attributeValue, callback);
}

/**
 * Generates the end of request handler that will generate the final response to the COAP Client.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @returns {Function}          Request handler, receiving an optional error and the write operation result.
 */
function endWrite(req, res) {
    return function (error, result) {
        if (error) {
            res.code = error.code;
            res.end('');
        } else {
            res.code = '2.04';
            res.end('');
        }
    };
}

/**
 * Handle the write operation.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @param {Function} handler    User handler to be executed if everything goes ok.
 */
function handleWrite(req, res, handler) {
    extractUriInfo(req, res, function (error, objectUri, resourceId, payload) {
        if (error) {
            endWrite(req, res)(error);
        } else {
            async.waterfall([
                apply(objectRegistry.setAttribute, objectUri, resourceId, payload),
                apply(applyHandler, resourceId, payload, handler)
            ], endWrite(req, res));
        }
    });
}

exports.handle = handleWrite;
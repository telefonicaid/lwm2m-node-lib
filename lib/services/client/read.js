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

function extractUriInfo(req, res, callback) {
    if (req.urlObj.pathname.match(/\/\d+\/\d+\/\d+/)) {
        var resourceIndex = req.urlObj.pathname.lastIndexOf('/'),
            resourceId = req.urlObj.pathname.substring(resourceIndex + 1),
            objectUri = req.urlObj.pathname.substring(0, resourceIndex);

        callback(null, objectUri, resourceId);
    } else {
        callback(new errors.WrongObjectUri(req.urlObj.pathname));
    }
}

/**
 * Invoke the user handler for this operation, with all the information from the query parameters as its arguments.
 * This method handling gives the client an opportunity to change or overwrite the values before returning them to
 * the client. The handler must call the callback with the overwritten value it wants to return. If the callback is
 * called without parameters, the original value is returned instead.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Function} handler        User handler to be invoked.
 */
function applyHandler(resourceId, handler, storedObject, callback) {
    if (storedObject.attributes[resourceId]) {
        handler(
            storedObject.objectType,
            storedObject.objectId,
            resourceId,
            storedObject.attributes[resourceId],

            function handleReadOverwrite(error, result) {
                if (result) {
                    callback(error, result);
                } else {
                    callback(error, storedObject.attributes[resourceId]);
                }
            });
    } else {
        callback(new errors.ResourceNotFound(storedObject.objectType, storedObject.objectId, resourceId));
    }
}

function endRead(req, res) {
    return function (error, result) {
        if (error) {
            res.code = error.code;
            res.end('');
        } else {
            res.code = '2.05';
            res.end(result);
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
function handleRegistration(req, res, handler) {
    extractUriInfo(req, res, function (error, objectUri, resourceId) {
        if (error) {
            endRead(req, res)(error);
        } else {
            async.waterfall([
                apply(objectRegistry.get, objectUri),
                apply(applyHandler, resourceId, handler)
            ], endRead(req, res));
        }
    });
}

exports.handle = handleRegistration;
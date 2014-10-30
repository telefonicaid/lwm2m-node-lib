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
    registry = require('./deviceRegistry'),
    coapUtils = require('./coapUtils');

/**
 *  Generates the end of request handler that will generate the final response to the COAP Client.
 */
function endRegistration(req, res) {
    return function (error, result) {
        if (error) {
            res.code = error.code;
            res.end('');
        } else {
            res.code = '2.01';
            res.setOption('Location-Path', '/rd/' + result[1]);
            res.end('');
        }
    };
}

/**
 * Invoke the user handler for this operation, with all the information from the query parameters as its arguments.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Function} handler        User handler to be invoked.
 */
function applyHandler(queryParams, handler, callback) {
    handler(queryParams.ep, queryParams.lt, queryParams.lwm2m, queryParams.b, callback);
}

/**
 * Creates the device object to be stored in the registry and stores it.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Object} req              Arriving COAP Request.
 */
function storeDevice(queryParams, req, callback) {
    var device = {
        name: queryParams.ep,
        lifetime: queryParams.lt,
        address: req.rsinfo.address
    };

    registry.register(device, callback);
}

/**
 * Handle the registration operation.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @param {Function} handler    User handler to be executed if everything goes ok.
 */
function handleRegistration(req, res, handler) {
    var queryParams = coapUtils.extractQueryParams(req);

    async.series([
        async.apply(coapUtils.checkMandatoryQueryParams, ['ep', 'b', 'lt'], queryParams),
        async.apply(storeDevice, queryParams, req),
        async.apply(applyHandler, queryParams, handler)
    ], endRegistration(req, res));
}

exports.handle = handleRegistration;
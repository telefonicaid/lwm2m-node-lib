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

var errors = require('../errors');

/**
 * Extract the query parameters from a COAP request, creating a JS Object with them. The function can be executed both
 * synchronously (if no callback is provided) or asynchronously.
 *
 * @param {Object}   req        COAP Request to process.
 * @param {Function} callback   Callback function (optional). The second parameter contains the query object.
 *
 * @returns {Object}            Query parameters object.
 */
function extractQueryParams(req, callback) {
    var queryParams;

    function extractAsObject(previous, current) {
        var fields = current.split('=');

        previous[fields[0]] = fields[1];

        return previous;
    }

    if (!req.urlObj) {
        req.urlObj = require('url').parse(req.url);
    }

    if (req.urlObj.query) {
        queryParams = req.urlObj.query.split('&');
    } else {
        queryParams = {};
    }

    if (callback) {
        callback(null, queryParams.reduce(extractAsObject, {}));
    } else {
        return queryParams.reduce(extractAsObject, {});
    }
}

/**
 * Checks that all the mandatory query parameters are present in the Query Parameters object. If any parameter is not
 * present, the callback is invoked with a BadRequestError, indicating the missing parameters.
 *
 * @param {Object} queryParams          Query Parameters object.
 */
function checkMandatoryQueryParams(mandatoryQueryParams, queryParams, callback) {
    var missing = [];

    for (var p in mandatoryQueryParams) {
        var found = false;

        for (var i in queryParams) {
            if (queryParams.hasOwnProperty(i)) {
                if (i === mandatoryQueryParams[p]) {
                    found = true;
                }
            }
        }

        if (!found) {
            missing.push(mandatoryQueryParams[p]);
        }
    }

    if (missing.length !== 0) {
        var error = new errors.BadRequestError('Missing query params: ');
        error.code = '4.00';

        callback(error);
    } else {
        callback();
    }
}

exports.extractQueryParams = extractQueryParams;
exports.checkMandatoryQueryParams = checkMandatoryQueryParams;
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

var errors = require('../errors'),
    logger = require('logops'),
    context = {
        op: 'LWM2MLib.COAPUtils'
    };

/**
 * Extract Object type, id and payload from the request URI, returning it using the callback.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 */

function extractUriInfo(req, res, callback) {
    var element,
        elementList = [],
        objectType,
        objectInstance,
        resourceId,
        objectUri,
        payload = req.payload.toString('utf8'),
        currentPath = req.urlObj.pathname;

    /* jshint -W084 */
    while (element = currentPath.match(/\/\d+/)) {
        elementList.push(element[0].substr(1));
        currentPath = currentPath.substr(element[0].length);
    }
    /* jshint +W084 */

    objectType = elementList[0];
    objectInstance = elementList[1];
    resourceId = elementList[2];

    if (objectInstance) {
        objectUri = '/' + objectType + '/' + objectInstance;
    } else {
        objectUri = '/' + objectType;
    }

    callback(null, objectUri, resourceId, payload);
}

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

    logger.debug(context, 'Extracting query parameters from request');

    function extractAsObject(previous, current) {
        var fields = current.split('=');

        previous[fields[0]] = fields[1];

        return previous;
    }

    if (!req.urlObj) {
        req.urlObj = require('url').parse(req.url);
    }

    if (req.urlObj.query) {
        logger.debug(context, 'Processing query [%s]', req.urlObj.query);

        queryParams = req.urlObj.query.split('&');
    } else {
        queryParams = [];
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

    logger.debug(context, 'Checking for the existence of the following parameters [%j]', mandatoryQueryParams);

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

        logger.debug(context, 'Missing parameters found [%j]', missing);
        callback(error);
    } else {
        callback();
    }
}

exports.extractQueryParams = extractQueryParams;
exports.checkMandatoryQueryParams = checkMandatoryQueryParams;
exports.extractUriInfo = extractUriInfo;

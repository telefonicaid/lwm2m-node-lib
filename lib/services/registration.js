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
    errors = require('../errors'),
    registry = require('./deviceRegistry'),
    coapUtils = require('./coapUtils');

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

function checkMandatoryQueryParams(queryParams, callback) {
    var mandatoryQueryParams = ['ep', 'b', 'lt'],
        missing = [];

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

function applyHandler(queryParams, handler, callback) {
    handler(queryParams.ep, queryParams.lt, queryParams.lwm2m, queryParams.b, callback);
}

function storeDevice(queryParams, callback) {
    var device = {
        name: queryParams.ep,
        lifetime: queryParams.lt
    };

    registry.register(device, callback);
}

function handleRegistration(req, res, handler) {
    var queryParams = coapUtils.extractQueryParams(req);

    async.series([
        async.apply(checkMandatoryQueryParams, queryParams),
        async.apply(storeDevice, queryParams),
        async.apply(applyHandler, queryParams, handler)
    ], endRegistration(req, res));
}

exports.handle = handleRegistration;
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
    errors = require('../errors');

function endRegistration(req, res) {
    return function (error, result) {
        if (error) {
            res.code = error.code;
            res.end('');
        } else {
            res.code = '2.01';
            res.end('');
        }
    }
}

function checkMandatoryQueryParams(req, callback) {
    var mandatoryQueryParams = ['ep', 'b', 'lt'],
        queryParams = req.urlObj.query.split('&'),
        missing = [];

    for (var p in mandatoryQueryParams) {
        var found = false;

        for (var i = 0; i < queryParams.length; i++) {
            var params = queryParams[i].split('=');

            if (params[0] === mandatoryQueryParams[p]) {
                found = true;
            }
        }

        if (!found) {
            missing.push(mandatoryQueryParams[p]);
        }
    }

    if (missing.length !== 0) {
        var error = new errors.BadRequestError("Missing query params: ");
        error.code = '4.00';

        callback(error);
    } else {
        callback();
    }
}

function handleRegistration(req, res) {
    async.series([
        async.apply(checkMandatoryQueryParams, req)
    ], endRegistration(req, res));
}

exports.handle = handleRegistration;
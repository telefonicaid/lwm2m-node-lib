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
    registry = require('./deviceRegistry');

function endUnregistration(req, res) {
    return function (error, result) {
        if (error) {
            res.code = error.code;
            res.end(error.message);
        } else {
            res.code = '2.02';
            res.end('');
        }
    };
}

function parsePath(req, callback) {
    var pathElements = req.urlObj.pathname.split('/');

    callback(null, pathElements[2]);
}

function applyHandler(handler, removedObj, callback) {
    handler(removedObj, callback);
}

function handleUnregistration(req, res, handler) {
    async.waterfall([
        async.apply(parsePath, req),
        registry.unregister,
        async.apply(applyHandler, handler)
    ], endUnregistration(req, res));
}

exports.handle = handleUnregistration;
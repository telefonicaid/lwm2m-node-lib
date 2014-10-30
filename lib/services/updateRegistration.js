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
    coapUtils = require('./coapUtils'),
    apply = async.apply;

function endUpdate(req, res) {
    return function (error, result) {
        if (error) {
            res.code = error.code;
            res.end(error.message);
        } else {
            res.code = '2.04';
            res.end('');
        }
    };
}

function updateRegister(req, queryParams, obj, callback) {
    obj.lifetime = queryParams.lt;
    obj.address = req.rsinfo.address;
    callback(null, obj);
}

function parsePath(req, callback) {
    var pathElements = req.urlObj.pathname.split('/');

    callback(null, pathElements[2]);
}

function applyHandler(handler, updatedObj, callback) {
    handler(updatedObj, callback);
}

function handleUnregistration(req, res, handler) {
    async.series([
        apply(coapUtils.extractQueryParams, req),
        apply(parsePath, req)
    ], function (error, extractedData) {
        if (error) {
            endUpdate(req, res)(error);
        } else {
            async.waterfall([
                apply(registry.get, extractedData[1]),
                apply(updateRegister, req, extractedData[0]),
                apply(registry.update, extractedData[1]),
                apply(applyHandler, handler)
            ], endUpdate(req, res));
        }
    });
}

exports.handle = handleUnregistration;
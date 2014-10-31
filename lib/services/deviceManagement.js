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
    coap = require('coap'),
    Readable = require('stream').Readable,
    errors = require('../errors'),
    registry = require('./deviceRegistry');

function sendRequest(request, callback) {
    var req = coap.request(request),
        rs = new Readable();

    req.on('response', function(res) {
        var data = '';

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function(chunk) {
            if (chunk) {
                data += chunk;
            }
            callback(null, res);
        });
    });

    if (request.payload) {
        rs.push(request.payload);
        rs.push(null);
        rs.pipe(req);
    } else {
        req.end();
    }
}

/**
 * Execute a read operation for the selected resource, identified following the LWTM2M conventions by its: deviceId,
 * objectType, objectId and resourceId.
 */
function read(deviceId, objectType, objectId, resourceId, callback) {
    function createReadRequest(obj, callback) {
        var request = {
            host: obj.address,
            port: 5683,
            method: 'GET',
            pathname: '/' + objectType + '/' + objectId + '/' + resourceId
        };

        callback(null, request);
    }

    function processResponse(res, callback) {
        if (res.code === '2.05') {
            callback(null, res.payload.toString('utf8'));
        } else {
            callback(new errors.ClientError(res.code));
        }
    }

    async.waterfall([
        apply(registry.get, deviceId),
        createReadRequest,
        sendRequest,
        processResponse
    ], callback);
}

function write(deviceId, objectType, objectId, resourceId, payload, callback) {
    function createUpdateRequest(obj, callback) {
        var request = {
            host: obj.address,
            port: 5683,
            method: 'PUT',
            pathname: '/' + objectType + '/' + objectId + '/' + resourceId,
            payload: payload
        };

        callback(null, request);
    }

    function processResponse(res, callback) {
        if (res.code === '2.04') {
            callback(null, res.payload.toString('utf8'));
        } else {
            callback(new errors.ClientError(res.code));
        }
    }

    async.waterfall([
        apply(registry.get, deviceId),
        createUpdateRequest,
        sendRequest,
        processResponse
    ], callback);
}

function execute(callback) {
    callback(null);

}

function setAttributes(callback) {
    callback(null);
}

exports.read = read;
exports.write = write;
exports.execute = execute;
exports.setAttributes = setAttributes;
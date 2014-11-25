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
    errors = require('../../errors'),
    registry = require('./inMemoryDeviceRegistry');

/**
 * Send the COAP Request passed as a parameter. If the request contains a parameter "payload", the parameter is sent
 * as the payload of the request; otherwise, the request is sent without any payload.
 *
 * @param {Object} request          Object containing all the request information (in the Node COAP format).
 */
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
 * Generates a generic response processing callback for all the resource based operations.
 *
 * @param {String} objectType           ID of the type of object.
 * @param {String} objectId             ID of the instance where the operation was performed.
 * @param code                          Return code if the callback is successful.
 * @returns {processResponse}           The generated handler.
 */
function generateProcessResponse(objectType, objectId, resourceId, code) {
    return function processResponse(res, callback) {
        if (res.code === code) {
            callback(null, res.payload.toString('utf8'));
        } else if (res.code === '4.04') {
            callback(new errors.ResourceNotFound(objectId, objectType, resourceId));
        } else {
            callback(new errors.ClientError(res.code));
        }
    };
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

    async.waterfall([
        apply(registry.get, deviceId),
        createReadRequest,
        sendRequest,
        generateProcessResponse(objectType, objectId, resourceId, '2.05')
    ], callback);
}

/**
 * Execute a Write operation over the selected resource, identified following the LWTM2M conventions by its: deviceId,
 * objectType, objectId and resourceId, changing its value to the value passed as a parameter.
 */
function write(deviceId, objectType, objectId, resourceId, value, callback) {
    function createUpdateRequest(obj, callback) {
        var request = {
            host: obj.address,
            port: 5683,
            method: 'PUT',
            pathname: '/' + objectType + '/' + objectId + '/' + resourceId,
            payload: value
        };

        callback(null, request);
    }

    function processResponse(res, callback) {
        if (res.code === '2.04') {
            callback(null, res.payload.toString('utf8'));
        } else if (res.code === '4.04') {
            callback(new errors.ObjectNotFound('/' + objectType + '/' + objectId));
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

/**
 * Write the attributes given as a parameter in the remote resource identified by the Object type and id in the
 * selected device.
 *
 * @param {String} deviceId             ID of the device that holds the resource.
 * @param {String} objectType           ID of the object type of the instance.
 * @param {String} objectId             ID of the instance whose resource will be modified.
 * @param {String} resourceId           ID of the resource to modify.
 * @param {Object} parameters           Object with the parameters to write: each parameter is stored as an attribute.
 */
function writeAttributes(deviceId, objectType, objectId, resourceId, attributes, callback) {
    function createQueryParams(innerCb) {
        var validAttributes = ['pmin', 'pmax', 'gt', 'lt', 'st', 'cancel'],
            result = '?',
            errorList = [];

        for (var i in attributes) {
            if (attributes.hasOwnProperty(i)) {
                if (validAttributes.indexOf(i) >= 0) {
                    result += i + '=' + attributes[i] + '&';
                } else {
                    errorList.push(i);
                }
            }
        }

        if (errorList.length !== 0) {
            innerCb(new errors.UnsupportedAttributes(errorList));
        } else {
            innerCb(null, result);
        }
    }

    function createWriteAttributesRequest(data, innerCb) {
        var request = {
            host: data[0].address,
            port: 5683,
            method: 'PUT',
            pathname: '/' + objectType + '/' + objectId + '/' + resourceId + data[1]
        };

        innerCb(null, request);
    }

    async.waterfall([
        apply(async.parallel, [
            apply(registry.get, deviceId),
            createQueryParams
        ]),
        createWriteAttributesRequest,
        sendRequest,
        generateProcessResponse(objectType, objectId, resourceId, '2.04')
    ], callback);
}

/**
 * Execute a discover operation for the selected resource, identified following the LWTM2M conventions by its:
 * deviceId, objectType, objectId and resourceId.
 */
function discover(deviceId, objectType, objectId, resourceId, callback) {
    function createReadRequest(obj, callback) {
        var request = {
            host: obj.address,
            port: 5683,
            method: 'GET',
            pathname: '/' + objectType + '/' + objectId + '/' + resourceId,
            options: {
                'Accept': 'application/link-format'
            }
        };

        callback(null, request);
    }

    async.waterfall([
        apply(registry.get, deviceId),
        createReadRequest,
        sendRequest,
        generateProcessResponse(objectType, objectId, resourceId, '2.05')
    ], callback);
}

function create(deviceId, objectType, objectId, callback) {
    function createUpdateRequest(obj, callback) {
        var request = {
            host: obj.address,
            port: 5683,
            method: 'POST',
            pathname: '/' + objectType + '/' + objectId
        };

        callback(null, request);
    }

    async.waterfall([
        apply(registry.get, deviceId),
        createUpdateRequest,
        sendRequest,
        generateProcessResponse(objectType, objectId, null, '2.01')
    ], callback);
}

function remove(deviceId, objectType, objectId, callback) {
    callback(null);
}

exports.read = read;
exports.write = write;
exports.execute = execute;
exports.writeAttributes = writeAttributes;
exports.discover = discover;
exports.create = create;
exports.remove = remove;
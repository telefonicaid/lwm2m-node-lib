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
    coapUtils = require('./coapUtils'),
    registry,
    logger = require('logops'),
    context = {
        op: 'LWM2MLib.InformationReporting'
    },
    subscriptions = {},
    _ = require('underscore');

function ResourceListener(deviceId, objectType, objectId, resourceId, observeStream) {
    return {
        resource: '/' + objectType + '/' + objectId + '/' + resourceId,
        deviceId: deviceId,
        stream: observeStream
    };
}

function processStream(deviceId, objectType, objectId, resourceId, handler, observeStream, callback) {
    var subscriptionId = deviceId + ':/' + objectType + '/' + objectId + '/' + resourceId;

    subscriptions[subscriptionId]= new ResourceListener(deviceId, objectType, objectId, resourceId, observeStream);

    observeStream.on('data', function (chunk) {
        logger.debug(context, 'New data on resource /%s/%s/%s in device [%d]',
            objectType, objectId, resourceId, deviceId);

        callback(null, chunk.toString('utf8'));
    });

    observeStream.on('finish', function(chunk) {
        logger.debug(context, 'Finished observing value of resource /%s/%s/%s in device [%d]',
            objectType, objectId, resourceId, deviceId);

        delete subscriptions[subscriptionId];
    });
}

function observe(deviceId, objectType, objectId, resourceId, handler, callback) {
    function createObserveRequest(obj, callback) {
        var request = {
            host: obj.address,
            port: 5683,
            method: 'GET',
            pathname: '/' + objectType + '/' + objectId + '/' + resourceId,
            observe: true
        };

        callback(null, request);
    }

    logger.debug(context, 'Observing value from resource /%s/%s/%s in device [%d]',
        objectType, objectId, resourceId, deviceId);

    async.waterfall([
        apply(registry.get, deviceId),
        createObserveRequest,
        coapUtils.sendRequest,
        apply(processStream, deviceId, objectType, objectId, resourceId, handler)
    ], callback);
}

function list(callback) {
    callback(null, _.values(subscriptions));
}

function clean(callback) {
    subscriptions = {};
    callback();
}

function init(deviceRegistry) {
    registry = deviceRegistry;
}

exports.observe = observe;
exports.list = list;
exports.clean = clean;
exports.init = init;

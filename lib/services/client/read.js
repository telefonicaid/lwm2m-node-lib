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
    objectRegistry = require('./objectRegistry'),
    errors = require('../../errors'),
    _ = require('underscore'),
    observers = {};

/**
 * Extract Object type and id from the request URI, returning it using the callback.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 */
function extractUriInfo(req, res, callback) {
    if (req.urlObj.pathname.match(/\/\d+\/\d+\/\d+/)) {
        var resourceIndex = req.urlObj.pathname.lastIndexOf('/'),
            resourceId = req.urlObj.pathname.substring(resourceIndex + 1),
            objectUri = req.urlObj.pathname.substring(0, resourceIndex);

        callback(null, objectUri, resourceId);
    } else {
        callback(new errors.WrongObjectUri(req.urlObj.pathname));
    }
}

/**
 * Invoke the user handler for this operation, with all the information from the query parameters as its arguments.
 * This method handling gives the client an opportunity to change or overwrite the values before returning them to
 * the client. The handler must call the callback with the overwritten value it wants to return. If the callback is
 * called without parameters, the original value is returned instead.
 *
 * @param {Object} queryParams      Object containing all the query parameters.
 * @param {Function} handler        User handler to be invoked.
 */
function applyHandler(resourceId, handler, storedObject, callback) {
    if (storedObject.attributes[resourceId]) {
        handler(
            storedObject.objectType,
            storedObject.objectId,
            resourceId,
            storedObject.attributes[resourceId],

            function handleReadOverwrite(error, result) {
                if (result) {
                    callback(error, result);
                } else {
                    callback(error, storedObject.attributes[resourceId]);
                }
            });
    } else {
        callback(new errors.ResourceNotFound(storedObject.objectType, storedObject.objectId, resourceId));
    }
}

/**
 * Generates the end of request handler that will generate the final response to the COAP Client.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @returns {Function}          Request handler, receiving an optional error and the read operation result.
 */
function endRead(req, res) {
    return function (error, result) {
        var body;

        if (error) {
            res.code = error.code;
            body = '';
        } else {
            res.code = '2.05';
            body = result;
        }

        if (_.some(req.options, _.matches({name: 'Observe'}))) {
            res.setOption('Observe', 1);
            res.write(body);
        } else {
            res.end(body);
        }
    };
}

/**
 * Constructs the resource observer. The observer listens in the object registry bus for attribute modifications,
 * sending a new information update to the server each time the selected attribute changes its value.
 *
 * @param {Object} stream           Stream where the new data will be written to the server.
 * @param {Number} resourceId       Resource to read from.
 * @param {Object} storedObject     Object instance to observe.
 * @returns {{uri: (object.objectUri|*|string), stream: *, observation: number}}
 * @constructor
 */
function ResourceObserver(stream, resourceId, storedObject) {
    var data = {
        id: storedObject.objectUri + '/' + resourceId,
        uri: storedObject.objectUri,
        stream: stream,
        observation: 1,
        listener: function newModification(method, id, value) {
            if (method === 'setAttribute' && resourceId === id) {
                data.observation++;
                stream.setOption('Observe', data.observation);
                stream.write(value.toString());
            }
        }
    };

    objectRegistry.bus.on(storedObject.objectUri, data.listener);

    return data;
}

/**
 * If the Read request comes with the observation option, apart from resolving the information request, a subscription
 * has to be created, so every time the selected resource changes in value (or in a timely basis, depending on the
 * configuration), the server is updated on the new value.
 *
 * @param {Object} req              Arriving COAP Request to be handled.
 * @param {Object} res              Outgoing COAP Response.
 * @param {Number} resourceId       ID of the resource to be observed.
 * @param {Object} storedObject     Object instance to be read.
 */
function createObservers(req, res, resourceId, storedObject, callback) {
    if (_.some(req.options, _.matches({name: 'Observe'}))) {
        var observer = new ResourceObserver(res, resourceId, storedObject);
        observers[observer.id] = observer;
    }

    callback(null, storedObject);
}

/**
 * Handle the read operation.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @param {Function} handler    User handler to be executed if everything goes ok.
 */
function handleRead(req, res, handler) {
    extractUriInfo(req, res, function (error, objectUri, resourceId) {
        if (error) {
            endRead(req, res)(error);
        } else {
            async.waterfall([
                apply(objectRegistry.get, objectUri),
                apply(createObservers, req, res, resourceId),
                apply(applyHandler, resourceId, handler)
            ], endRead(req, res));
        }
    });
}

function cancelObservation(objUri, resourceId, callback) {
    observers[objUri + '/' + resourceId].stream.end();
    objectRegistry.bus.removeListener(objUri, observers[objUri + '/' + resourceId].listener);
    delete observers[objUri + '/' + resourceId];

    callback(null);
}

function listObservers(callback) {
    callback(null, _.values(observers));
}

exports.handle = handleRead;
exports.cancel = cancelObservation;
exports.list = listObservers;
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

var async = require('async'),
    apply = async.apply,
    objectRegistry = require('./objectRegistry'),
    errors = require('../../errors'),
    logger = require('logops'),
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
    } else if (req.urlObj.pathname.match(/\/\d+(\/\d+)?/)) {
        callback(null, req.urlObj.pathname, null);
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
 * Cancel the observation on the resource identified by the object URI and resource ID passed as parameters.
 *
 * @param {String} objUri       URI of the object the resource belongs to (e.g.: /1/4).
 * @param {String} resourceId   ID of the observed resource.
 */
function cancelObservation(objUri, resourceId, callback) {
    if (observers[objUri + '/' + resourceId]) {
        if (observers[objUri + '/' + resourceId].stream) {
            observers[objUri + '/' + resourceId].stream.end();
        }

        if (observers[objUri + '/' + resourceId]) {
            clearInterval(observers[objUri + '/' + resourceId].scheduler);
        }

        objectRegistry.bus.removeListener(objUri, observers[objUri + '/' + resourceId].listener);
        delete observers[objUri + '/' + resourceId];
    } else {
        logger.error('Tried to remove an unexistant observation on obj URI [%s] and resourceId [%s]',
            objUri, resourceId);
    }

    callback(null);
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
            body = result.toString();
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
        resourceId: resourceId,
        stream: stream,
        observation: 1,
        listener: function newModification(method, id, value) {
            if (method === 'setResource' && resourceId === id.toString()) {
                logger.debug('Sending data update to the server for object [%s]', data.uri);

                try {
                    stream.setOption('Observe', data.observation);
                    stream.write(value.toString());
                    data.observation++;
                    data.lastObservation = Date.now();
                } catch(error) {
                    logger.error('Tried to write to a closed stream. Cleaning the handler.');
                    cancelObservation(data.uri, resourceId, function() {
                        logger.info('Observation of [%s] cancelled', data.id);
                    });
                }
            }
        }
    };

    function getLastMeasure() {
        objectRegistry.get(storedObject.objectUri, function (error, obj) {
            if (error) {
                logger.error('Error retrieving the last resource value');
            } else {
                data.listener('setResource', resourceId, obj.attributes[resourceId]);
            }
        });
    }

    objectRegistry.getAttributes(storedObject.objectUri + '/' + resourceId, function(error, attributes) {
        if (error) {
            logger.error('Couldn\'t find attributes for the [%s] resource URI. Falling back to value changed');
        }

        if (attributes) {
            if (attributes.pmax) {
                logger.debug('Creating a scheduled observation for [%d] miliseconds for object [%s]',
                    attributes.pmax, storedObject.objectUri);

                data.scheduler = setInterval(function handleMaxPeriod() {
                    getLastMeasure(storedObject.objectUri, resourceId);
                }, attributes.pmax);
            }
        } else {
            logger.debug('Creating an onchange subscription for object [%s]', storedObject.objectUri);
            objectRegistry.bus.on(storedObject.objectUri, data.listener);
        }
    });

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

function addAttribute(previous, value) {
    return previous + ';' + value[0] + '=' + value[1];
}

function discoverResourceAttributes(objectUri, resourceId, callback) {
    objectRegistry.getAttributes(objectUri + '/' + resourceId, function (error, attributes) {
        if (error) {
            callback(error);
        } else {
            var payload = '<' + objectUri + '/' + resourceId + '>';

            if (attributes) {
                payload = _.pairs(attributes).reduce(addAttribute, payload);
            }

            callback(null, payload);
        }
    });
}

function discoverObjectResources(objectUri, callback) {
    async.series([
        apply(objectRegistry.get, objectUri),
        apply(objectRegistry.getAttributes, objectUri)
    ], function handleGetObject(error, results) {
        var obj = results[0],
            attributes = results[1];

        if (error) {
            callback(error);
        } else {
            var payload = '<' + objectUri + '>',
                resources = _.keys(obj.attributes);

            if (attributes) {
                payload += _.pairs(attributes).reduce(addAttribute, '');
            }

            for (var i = 0; i < resources.length; i++) {
                payload += ',<' + objectUri + '/' + resources[i] + '>';
            }

            callback(null, payload);
        }
    });
}

function discoverObjectTypeInstances(objectTypeUri, callback) {
    async.series([
        objectRegistry.list,
        apply(objectRegistry.getAttributes, objectTypeUri)
    ], function handleListResult(error, results) {
        var objList = results[0],
            attributes = results[1];

        if (error) {
            callback(error);
        } else {
            var payload = '<' + objectTypeUri + '>',
                objectType = objectTypeUri.substring(1);

            if (attributes) {
                payload += _.pairs(attributes).reduce(addAttribute, '');
            }

            for (var i = 0; i < objList.length; i++) {
                if (objList[i].objectType === objectType) {
                    payload += ',<' + objList[i].objectUri + '>';
                }
            }

            callback(null, payload);
        }
    });
}

/**
 * Handle the read operation.
 *
 * @param {Object} req          Arriving COAP Request to be handled.
 * @param {Object} res          Outgoing COAP Response.
 * @param {Function} handler    User handler to be executed if everything goes ok.
 */
function handleRead(req, res, handler) {
    logger.debug('Handling incoming read request');

    extractUriInfo(req, res, function (error, objectUri, resourceId) {
        if (error) {
            endRead(req, res)(error);
        } else {
            if (_.some(req.options, _.matches({name: 'Accept', value: 'application/link-format'}))) {
                logger.debug('Retrieving simple response with static information for object: %s', objectUri);
                if (resourceId) {
                    discoverResourceAttributes(objectUri, resourceId, endRead(req, res));
                } else if (objectUri.match(/\/\d+\/\d+/)) {
                    discoverObjectResources(objectUri, endRead(req, res));
                } else {
                    discoverObjectTypeInstances(objectUri, endRead(req, res));
                }
            } else {
                logger.debug('Creating observers for object URI: %s', objectUri);
                async.waterfall([
                    apply(objectRegistry.get, objectUri),
                    apply(createObservers, req, res, resourceId),
                    apply(applyHandler, resourceId, handler)
                ], endRead(req, res));
            }
        }
    });
}

function listObservers(callback) {
    callback(null, _.values(observers));
}

function cancelAllObservers(callback) {
    var observerValues = _.values(observers),
        cancellations = [];

    for (var i = 0; i < observerValues.length; i++) {
        cancellations.push(apply(cancelObservation, observerValues[i].uri, observerValues[i].resourceId));
    }

    async.series(cancellations, callback);
}

exports.handle = handleRead;
exports.cancel = cancelObservation;
exports.list = listObservers;
exports.cancelAll = cancelAllObservers;
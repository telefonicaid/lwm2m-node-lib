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

var errors = require('../../errors'),
    registryBus  = new (require('events')).EventEmitter(),
    registry = {},
    attributesRegistry = {},
    OBJECT_URI_REGEX = /^\/\d+\/\d+$/;

registryBus.setMaxListeners(0);

/**
 * Parse a string containing an Object URI. If the URI is not well-formed or if it contains anything beyond the Object
 * ID, an error is raised.
 *
 * @param {String} objectUri        String representation of an OMA LWTM2M Object URI (with object Type and Id)
 */
function parseUri(objectUri, callback) {
    if (objectUri && objectUri.match && objectUri.match(OBJECT_URI_REGEX)) {
        var parsedUri = objectUri.split('/'),
            object = {
                objectType: parsedUri[1],
                objectId: parsedUri[2],
                objectUri: objectUri
            };

        callback(null, object);
    } else {
        callback(new errors.WrongObjectUri(objectUri));
    }
}

/**
 * Get the object of the registry represented by the given String URI.
 *
 * @param {String} objectUri        String representation of an OMA LWTM2M Object URI (with object Type and Id)
 */
function getObject(objectUri, callback) {
    parseUri(objectUri, function(error, parsedObject) {
        if (error) {
            callback(error);
        } else if (registry[objectUri]) {
            callback(null, registry[objectUri]);
        } else {
            callback(new errors.ObjectNotFound(objectUri));
        }
    });
}

/**
 * Create a new object in the registry with the given URI. If there already is an object in that URI, it is overwritten.
 *
 * @param {String} objectUri        String representation of an OMA LWTM2M Object URI (with object Type and Id)
 */
function create(objectUri, callback) {
    parseUri(objectUri, function(error, parsedObject) {
        if (error) {
            callback(error);
        } else {
            registry[objectUri] = parsedObject;
            registry[objectUri].attributes = {};

            callback(null, parsedObject);
        }
    });
}

/**
 * Removes the object identified by the URI from the registry.
 *
 * @param {String} objectUri        String representation of an OMA LWTM2M Object URI (with object Type and Id)
 */
function remove(objectUri, callback) {
    parseUri(objectUri, function(error, parsedObject){
        if (error) {
            callback(error);
        } else if (registry[objectUri]) {
            var removedObj = registry[objectUri];
            delete registry[objectUri];
            callback(null, removedObj);
        } else {
            callback(new errors.ObjectNotFound(objectUri));
        }
    });
}

/**
 * List all the objects in the object registry.
 */
function list(callback) {
    var keyList = Object.keys(registry),
        result = [];

    for (var i=0; i < keyList.length; i++) {
        result.push(registry[keyList[i]]);
    }

    callback(null, result);
}

/**
 * Modify the object represented by the given URI, by setting the selected resource to the given value. If the resource
 * doesn't exist it is created. If it does exist, its value is overwritten.
 *
 * @param {String} objectUri                         String representation of an OMA LWTM2M Object URI
 *                                                  (with object Type and Id)
 * @param {Integer} resourceId                      Id of the resource to set
 * @param {String} resourceValue                    New value of the resource
 */
function setResource(objectUri, resourceId, resourceValue, callback) {
    getObject(objectUri, function(error, retrievedObject) {
        if (error) {
            callback(error);
        } else {
            registryBus.emit(objectUri, 'setResource', resourceId, resourceValue);
            retrievedObject.attributes[resourceId] = resourceValue;
            callback(null, retrievedObject);
        }
    });
}

/**
 * Modify the object represented by the given URI, by removing the selected resource.
 *
 * @param objectUri                         String representation of an OMA LWTM2M Object URI (with object Type and Id)
 * @param {Integer} resourceId              Id of the resource to remove
 */
function unsetResource(objectUri, resourceId, callback) {
    getObject(objectUri, function(error, retrievedObject) {
        if (error) {
            callback(error);
        } else {
            delete retrievedObject.attributes[resourceId];
            callback(null, retrievedObject);
        }
    });
}

/**
 * Removes all information an handlers from the registry, setting it back to its original state.
 */
function resetRegistry(callback) {
    registryBus.removeAllListeners();
    registry = {};

    attributesRegistry = {};

    if (callback) {
        callback();
    }  else {
        return;
    }
}

/**
 * Set the attribute set passed as a parameter as the attributes for the object type, instance or resource indicated.
 * The set of attributes is completely overwritten by the new one.
 *
 * @param {String} uri          URI of an object type, instance or resource.
 * @param {String} attributes   Object containing the new set of attributes for the selected entity.
 */
function setAttributes(uri, attributes, callback) {
    attributesRegistry[uri] = attributes;

    if (callback) {
        callback();
    }  else {
        return;
    }
}

/**
 * Get the current set of attributes for the given entity (object type, instance or resource).
 *
 * @param {String} uri          URI of an object type, instance or resource.
 * @returns {Object}            An object containing the current attributes or undefined if there are no attributes.
 */
function getAttributes(uri, callback) {
    if (callback) {
        callback(null, attributesRegistry[uri]);
    }  else {
        return attributesRegistry[uri];
    }
}

exports.create = create;
exports.remove = remove;
exports.get = getObject;
exports.setResource = setResource;
exports.unsetResource = unsetResource;
exports.setAttributes = setAttributes;
exports.getAttributes = getAttributes;
exports.list = list;
exports.bus = registryBus;
exports.reset = resetRegistry;
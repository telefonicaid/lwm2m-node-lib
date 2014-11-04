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

var errors = require('../../errors'),
    registry = {},
    OBJECT_URI_REGEX = /^\/\d+\/\d+$/;

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

function list(callback) {
    var keyList = Object.keys(registry),
        result = [];

    for (var i=0; i < keyList.length; i++) {
        result.push(registry[keyList[i]]);
    }

    callback(null, result);
}

function setAttribute(objectUri, resourceId, resourceValue, callback) {
    getObject(objectUri, function(error, retrievedObject) {
        if (error) {
            callback(error);
        } else {
            retrievedObject.attributes[resourceId] = resourceValue;
            callback(null, retrievedObject);
        }
    });
}

function unsetAttribute(objectUri, resourceId, callback) {
    getObject(objectUri, function(error, retrievedObject) {
        if (error) {
            callback(error);
        } else {
            delete retrievedObject.attributes[resourceId];
            callback(null, retrievedObject);
        }
    });
}

exports.create = create;
exports.remove = remove;
exports.get = getObject;
exports.setAttribute = setAttribute;
exports.unsetAttribute = unsetAttribute;
exports.list = list;
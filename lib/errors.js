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

module.exports = {
    BadRequestError: function(message) {
        this.name = 'BAD_REQUEST_ERROR';
        this.message = 'The request was not build correctly: ' + message;
        this.code = '4.00';
    },
    DeviceNotFound: function(id) {
        this.name = 'DEVICE_NOT_FOUND';
        this.message = 'The device with id: ' + id + ' was not found';
        this.code = '4.04';
    },
    ClientError: function(code) {
        this.name = 'CLIENT_ERROR';
        this.message = 'Error code recieved from the client: ' + code;
        this.code = code;
    },
    ObjectNotFound: function(id) {
        this.name = 'OBJECT_NOT_FOUND';
        this.message = 'The object with id: ' + id + ' was not found in the registry';
        this.code = '4.04';
    },
    UnsupportedAttributes: function (attributes) {
        this.name = 'UNSUPPORTED_ATTRIBUTES';
        this.message = 'Unsupported attributes writting to object URI: ' + JSON.stringify(attributes);
        this.code = '4.00';
    },
    ServerNotFound: function(url) {
        this.name = 'SERVER_NOT_FOUND';
        this.message = 'No server was found on url: ' + url;
        this.code = '4.04';
    },
    ResourceNotFound: function(id, type, objectId) {
        this.name = 'RESOURCE_NOT_FOUND';
        this.code = '4.04';

        if (id && type && objectId) {
            this.message = 'The resource with id: ' + id + ' for the object with type ' + type + ' id ' + objectId +
            ' was not found in the registry';
        } else {
            this.message = 'The resource was not found in the registry';
        }
    },
    WrongObjectUri: function(uri) {
        this.name = 'WRONG_OBJECT_URI';
        this.message = 'Tried to parse wrong object URI: ' + uri;
        this.code = '4.00';
    },
    InternalDbError: function(msg) {
        this.name = 'INTERNAL_DB_ERROR';
        this.message = 'An internal DB Error happened: ' + msg;
        this.code = '5.01';
    },
    TypeNotFound: function(url) {
        this.name = 'TYPE_NOT_FOUND';
        this.message = 'No type matching found for URL ' + url;
        this.code = '4.04';
    },
    IllegalTypeUrl: function(url) {
        this.name = 'ILLEGAL_TYPE_URL';
        this.message = 'Illegal URL for type: ' + url + '. Types begining with "/rd" are not allowed';
        this.code = '4.00';
    },
    RegistrationError: function(msg) {
        this.name = 'REGISTRATION_ERROR';
        this.message = 'There was an error connecting to the LWM2M Server for registration: ' + msg;
        this.code = '5.01';
    },
    UpdateRegistrationError: function(msg) {
        this.name = 'UPDATE_REGISTRATION_ERROR';
        this.message = 'There was an error connecting to the LWM2M Server for update registration: ' + msg;
        this.code = '5.01';
    },
    UnregistrationError: function(msg) {
        this.name = 'UNREGISTRATION_ERROR';
        this.message = 'There was an error connecting to the LWM2M Server for unregistration: ' + msg;
        this.code = '5.01';
    },
    RegistrationFailed: function(code) {
        this.name = 'REGISTRATION_FAILED';
        this.message = 'Registration to the Lightweight M2M server failed with code: ' + code;
        this.code = code;
    },
    IllegalMethodAttributes: function(code) {
        this.name = 'ILLEGAL_METHOD_ATTRIBUTES';
        this.message = 'The method was called with wrong number or type of attributes ' +
            'or at least one mandatory attribute is empty';
        this.code = '5.01';
    },
    ClientConnectionError: function(msg) {
        this.name = 'CLIENT_CONNECTION_ERROR';
        this.message = 'There was an error sending a request to the client: ' + msg;
        this.code = '5.01';
    },
    ClientResponseError: function(msg) {
        this.name = 'CLIENT_RESPONSE_ERROR';
        this.message = 'Error received while waiting for a client response: ' + msg;
        this.code = '5.01';
    },
    ContentFormatNotFound: function() {
        this.name = 'CONTENT_FORMAT_NOT_FOUND';
        this.message = 'No Content Format list found.';
        this.code = '4.00';
    }
};


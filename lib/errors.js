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

module.exports = {
    BadRequestError: function(message) {
        this.name = 'BAD_REQUEST_ERROR';
        this.message = 'The request was not build correctly: ' + message;
    },
    DeviceNotFound: function(id) {
        this.name = 'DEVICE_NOT_FOUND';
        this.message = 'The device with id: ' + id + ' was not found';
        this.code = '4.04';
    },
    ClientError: function(code) {
        this.name = 'CLIENT_ERROR';
        this.message = 'Error code recieved from the client: ' + code;
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
        this.message = 'The resource with id: ' + id + ' for the object with type ' + type + ' id ' + objectId +
            ' was not found in the registry';
        this.code = '4.04';
    },
    WrongObjectUri: function(uri) {
        this.name = 'WRONG_OBJECT_URI';
        this.message = 'Tried to parse wrong object URI: ' + uri;
    },
    InternalDbError: function(msg) {
        this.name = 'INTERNAL_DB_ERROR';
        this.message = 'An internal DB Error happened: ' + msg;
    },
    TypeNotFound: function(url) {
        this.name = 'TYPE_NOT_FOUND';
        this.message = 'No type matching found for URL ' + url;
        this.code = '4.00';
    },
    IllegalTypeUrl: function(url) {
        this.name = 'ILLEGAL_TYPE_URL';
        this.message = 'Illegal URL for type: ' + url + '. Types begining with "/rd" are not allowed';
    },
    RegistrationFailed: function(code) {
        this.name = 'REGISTRATION_FAILED';
        this.message = 'Registration to the Lightweight M2M server failed with code: ' + code;
    }
};
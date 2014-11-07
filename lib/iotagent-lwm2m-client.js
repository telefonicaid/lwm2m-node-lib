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

var objRegistry = require('./services/client/objectRegistry'),
    coap = require('coap'),
    coapRouter = require('./services/coapRouter'),
    Readable = require('stream').Readable,
    config = require('../config');

/**
 * Load the internal handlers for each kind of operation. Each handler is implemented in a separated module. This
 * module will be, in time, in charge of executing the user handler for that operation with all the data extracted
 * from the request (and completed with internal data if needed).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadHandlers(serverInfo) {
    serverInfo.handlers = {
        write: {
            lib: require('./services/client/write').handle,
            user: coapRouter.defaultHandler
        }
    };
}

/**
 * Load the tables of available routes. For each route, the method, a regexp for the path and the name of the operation
 * is indicated (the name of the operation will be used to select the internal and user handlers to execute for each
 * route).
 *
 * @param {Object} serverInfo      Object containing all the information of the current server.
 */
function loadRoutes(serverInfo) {
    serverInfo.routes = [
        ['PUT', /\/\d+\/\d+\/\d+/, 'write']
    ];
}

/**
 * Register the client in the Lightweight M2M Server in the seleted host and port, with the given endpoint name. If the
 * registration is successful, a deviceInformation object is returned with the host and port of the connected server
 * and the device location in that server (usually with the form '/rd/<deviceId'.
 *
 * @param {String} host                  Host of the LWTM2M Server
 * @param {String} port                  Port of the LWTM2M Server
 * @param {String} endpointName          Name the client will be registered under
 */
function register(host, port, endpointName, callback) {
    var rs = new Readable(),
        creationRequest =  {
            host: host,
            port: port,
            method: 'POST',
            pathname: '/rd',
            query: 'ep=' +  endpointName + '&lt=' + config.client.lifetime + '&lwm2m=' + config.client.version + '&b=U'
        },
        payload = '</1>, </2>, </3>, </4>, </5>',
        req = coap.request(creationRequest);

    rs.push(payload);
    rs.push(null);
    rs.pipe(req);

    req.on('response', function(res) {
        var deviceInformation = {
            currentHost: host,
            currentPort: port,
            location: ''
        };

        coapRouter.start(config.client, function (error, serverInfo) {
            if (error) {
                callback(error);
            } else {
                deviceInformation.serverInfo = serverInfo;

                loadHandlers(deviceInformation.serverInfo);
                loadRoutes(deviceInformation.serverInfo);

                for (var i = 0; i < res.options.length; i++) {
                    if (res.options[i].name === 'Location-Path') {
                        deviceInformation.location = res.options[i].value;
                    }
                }

                callback(null, deviceInformation);
            }
        });
    });
}

/**
 * Unregisters the client from the given server.
 *
 * @param {Object} deviceInformation        Device information object retrieved during the connection
 */
function unregister(deviceInformation, callback) {
    var creationRequest =  {
            host: deviceInformation.currentHost,
            port: deviceInformation.currentPort,
            method: 'DELETE',
            pathname: deviceInformation.location
        },
        req = coap.request(creationRequest);

    req.on('response', function(res) {
        coapRouter.stop(deviceInformation.serverInfo, callback);
    });

    req.end();
}

function updateRegistration(deviceInformation, callback) {
    var rs = new Readable(),
        creationRequest =  {
            host: deviceInformation.currentHost,
            port: deviceInformation.currentPort,
            method: 'PUT',
            pathname: deviceInformation.location,
            query: 'lt=' + config.client.lifetime + '&lwm2m=' + config.client.version + '&b=U'
        },
        payload = '</1>, </2>, </3>, </4>, </5>',
        req = coap.request(creationRequest);

    rs.push(payload);
    rs.push(null);
    rs.pipe(req);

    req.on('response', function(res) {
        callback(null, deviceInformation);
    });
}

exports.registry = objRegistry;
exports.register = register;
exports.unregister = unregister;
exports.update = updateRegistration;
exports.setHandler = coapRouter.setHandler;



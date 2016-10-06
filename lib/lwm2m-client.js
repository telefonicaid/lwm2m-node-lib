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

var objRegistry = require('./services/client/objectRegistry'),
    coap = require('coap'),
    errors = require('./errors'),
    async = require('async'),
    apply = async.apply,
    readService = require('./services/client/read'),
    coapRouter = require('./services/coapRouter'),
    Readable = require('stream').Readable,
    logger = require('logops'),
    config,
    context = {
        op: 'LWM2MLib.Client'
    };

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
        },
        execute: {
            lib: require('./services/client/execute').handle,
            user: coapRouter.defaultHandler
        },
        read: {
            lib: readService.handle,
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
        ['POST', /\/\d+\/\d+\/\d+/, 'execute'],
        ['PUT', /(\/\d+)+/, 'write'],
        ['GET', /(\/\d+)+/, 'read']
    ];
}

/**
 * Starts a new listener for the client in the same port used for the communication. Some problems may arrise here
 * due to the time the socket needs to be freed from its previous use. To avoid this problem, a small delay is added
 * before any retry and the connection is retried n times.
 *
 * @param {Object} deviceInformation        Listener information from the COAP library
 */
function startListener(deviceInformation, callback) {
    config.client.port = deviceInformation.localPort;

    function extractListenerInfo(serverInfo, innerCallback) {
        logger.debug(context, 'COAP Router started successfully');

        deviceInformation.serverInfo = serverInfo;
        loadHandlers(deviceInformation.serverInfo);
        loadRoutes(deviceInformation.serverInfo);

        innerCallback(null, deviceInformation);
    }

    function startCoapServer(innerCallback) {
        try {
            coapRouter.start(config.client, innerCallback);
        } catch(error) {
            innerCallback(error);
        }
    }

    function handleListenerStarted(error, deviceInformation) {
        if (error) {
            logger.error(context, 'Failed to start COAP Router for client.');
        } else {
            callback(null, deviceInformation);
        }
    }

    function startListener(innerCallback) {
        async.waterfall([
            async.nextTick,
            startCoapServer,
            extractListenerInfo
        ], innerCallback);
    }

    async.retry({times: 3, interval: 10}, startListener, handleListenerStarted);
}

function createRegisterResponseHandler(deviceInformation, callback) {
    return function responseHandler(res) {
        if (res.code.match(/^2\.\d\d$/)) {
            logger.debug(context, 'Registration oparation succeeded to host [%s] and port [%s] with code [%s]',
                deviceInformation.host, deviceInformation.port, res.code);

            deviceInformation.localPort = res.outSocket.port;

            for (var i = 0; i < res.options.length; i++) {
                if (res.options[i].name === 'Location-Path') {
                    if (deviceInformation.location) {
                        deviceInformation.location += '/';
                    }

                    deviceInformation.location += res.options[i].value;
                }
            }

            callback(null);
        } else {
            logger.error(context, 'Registration failed with code: ' + res.code);
            callback(new errors.RegistrationFailed(res.code));
        }
    };
}

/**
 * Creates a COAP Text representation of the objects passed as a parameter.
 *
 * @param {Array} objects       Array containing LWM2M Object instances.
 */
function generatePayload(objects, innerCallback) {
    var result = objects.reduce(function(previous, current, index, array) {
        var result = previous + '<' + current.objectUri + '>';

        if (index !== array.length -1) {
            result += ',';
        }

        return result;
    }, '');

    logger.debug(context, 'Object list generated:\n%s', objects);

    innerCallback(null, result);
}

/**
 * Register the client in the Lightweight M2M Server in the seleted host and port, with the given endpoint name. If the
 * registration is successful, a deviceInformation object is returned with the host and port of the connected server
 * and the device location in that server (usually with the form '/rd/<deviceId>').
 *
 * @param {String} host                  Host of the LWTM2M Server
 * @param {String} port                  Port of the LWTM2M Server
 * @param {String} url                   URL of the LWTM2M Server (optional)
 * @param {String} endpointName          Name the client will be registered under
 */
function register(host, port, url, endpointName, callback) {
    var rs = new Readable(),
        creationRequest =  {
            host: host,
            port: port,
            method: 'POST',
            pathname: ((url)? url : '') + '/rd',
            query: 'ep=' +  endpointName + '&lt=' + config.client.lifetime + '&lwm2m=' + config.client.version + '&b=U'
        },
        agent = new coap.Agent({type: config.client.ipProtocol}),
        req = agent.request(creationRequest),
        deviceInformation = {
            currentHost: host,
            currentPort: port,
            location: ''
        };

    if (config.logLevel) {
        logger.setLevel(config.client.logLevel);
    }

    function sendRequest(payload, innerCallback) {
        logger.debug(context, 'Sending registration request');

        rs.push(payload);
        rs.push(null);

        rs.on('error', function(error) {
            logger.error(context, 'Error found trying to send registration request: %s', payload);
            innerCallback(new errors.RegistrationError(error));
        });

        req.on('response', createRegisterResponseHandler(deviceInformation, innerCallback));

        req.on('error', function(error) {
            req.removeAllListeners();

            if (error.code === 'ENOTFOUND') {
                logger.error(context, 'Server not found [%s]', req.url.host);
                innerCallback(new errors.ServerNotFound(req.url.host));
            } else {
                logger.error(context, 'An error was found while trying to register a response listener');
                innerCallback(new errors.RegistrationError(error));
            }
        });

        rs.pipe(req);
    }

    async.waterfall([
        objRegistry.list,
        generatePayload,
        sendRequest,
        async.apply(startListener, deviceInformation)
    ], callback);
}


function updateRegistration(deviceInformation, callback) {
    var rs = new Readable(),
        creationRequest =  {
            host: deviceInformation.currentHost,
            port: deviceInformation.currentPort,
            method: 'POST',
            pathname: deviceInformation.location,
            query: 'lt=' + config.client.lifetime + '&lwm2m=' + config.client.version + '&b=U'
        },
        agent = new coap.Agent({type: config.client.ipProtocol}),
        req = agent.request(creationRequest);

    logger.debug(context, 'Update registration request:\n%s', JSON.stringify(creationRequest, null, 4));

    function sendRequest(payload, innerCallback) {
        rs.push(payload);
        rs.push(null);

        rs.on('error', function(error) {
            logger.error(context, 'There was a connection error during update registration process: %s', error);
            callback(new errors.UpdateRegistrationError(error));
        });

        req.on('response', createRegisterResponseHandler(deviceInformation, innerCallback));

        req.on('error', function(error) {
            req.removeAllListeners();

            logger.error(context, 'Request error during update registration process: %s', error);
            innerCallback(new errors.UpdateRegistrationError(error));
        });

        rs.pipe(req);
    }

    async.waterfall([
        objRegistry.list,
        generatePayload,
        sendRequest,
        async.apply(startListener, deviceInformation)
    ], callback);
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
            pathname: deviceInformation.location,
            agent: false
        },
        agent = new coap.Agent({type: config.client.ipProtocol}),
        req = agent.request(creationRequest);

    logger.debug(context, 'Unregistration request:\n%s', JSON.stringify(creationRequest, null, 4));

    req.on('response', function(res) {
        logger.debug(context, 'Unregistration response code:\n%s', res.code);

        async.series([
            readService.cancelAll,
            apply(coapRouter.stop, deviceInformation.serverInfo)
        ], callback);
    });

    req.on('error', function(error) {
        logger.error(context, 'There was an error during unregistration: %s', error);
        callback(new errors.UnregistrationError(error));
    });

    req.end();
}

/**
 * Sets the configuration the client module will use in its interactions.
 *
 * @param {Object} newConfig            Configuration object.
 */
function init(newConfig, callback) {
    config = newConfig;

    if (callback) {
        callback();
    }
}

exports.init = init;
exports.registry = objRegistry;
exports.register = register;
exports.unregister = unregister;
exports.update = updateRegistration;
exports.setHandler = coapRouter.setHandler;
exports.cancelObserver = readService.cancel;
exports.cancellAllObservers = readService.cancelAll;
exports.listObservers = readService.list;

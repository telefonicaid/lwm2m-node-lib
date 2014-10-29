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

var libcoap = require('coap'),
    registry = require('./services/deviceRegistry'),
    server,
    routes,
    handlers;


function dataHandler(req, res) {
    req.urlObj = require('url').parse(req.url);

    for (var i in routes) {
        if (req.method === routes[i][0] &&
            req.urlObj.pathname.match(routes[i][1]) &&
            handlers[routes[i][2]].user) {
            handlers[routes[i][2]].lib(req, res, handlers[routes[i][2]].user);
            return;
        }
    }

    res.code = '5.01';
    res.end('');
}

function loadDefaultHandlers() {
    handlers = {
        registration: {
            lib: require('./services/registration').handle
        },
        unregistration: {
            lib: require('./services/unregistration').handle
        }
    };
}

function loadRoutes() {
    routes = [
        ['POST', /\/rd/, 'registration'],
        ['DELETE', /\/rd\/.*/, 'unregistration']
    ];
}

function startCoap(config, callback) {
    server = libcoap.createServer();

    loadDefaultHandlers();
    loadRoutes();

    server.on('request', dataHandler);

    server.listen(function () {
        registry.clean(callback);
    });
}

function stopCoap(callback) {
    server.close(callback);
}

function setHandler(type, handler) {
    handlers[type].user = handler;
}

exports.start = startCoap;
exports.stop = stopCoap;
exports.setHandler = setHandler;
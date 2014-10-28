/*
 * Copyright 2013 Telefonica Investigación y Desarrollo, S.A.U
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
    server,
    routes;


function dataHandler(req, res) {
    req.urlObj = require('url').parse(req.url);

    for (var i in routes) {
        if (req.method === routes[i][0] &&
            req.urlObj.pathname === routes[i][1]) {
            routes[i][2](req, res);
            return;
        }
    }

    res.code = '5.01';
    res.end('');
}

function handleRegistration(req, res) {
    res.code = '2.01';
    res.end('');
}

function loadRoutes() {
    routes = [
        ['POST', '/rd', handleRegistration]
    ];
}

function startCoap(config, callback) {
    console.log('Configuring COAP server');

    server = libcoap.createServer();

    loadRoutes();
    server.on('request', dataHandler);

    server.listen(function () {
        console.log('COAP Server listening');

        callback();
    });
}

function stopCoap(callback) {
    server.close(callback);
}

exports.start = startCoap;
exports.stop = stopCoap;
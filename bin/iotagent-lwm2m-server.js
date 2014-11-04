#!/usr/bin/env node

/*
 * Copyright 2014 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 */

var config = require('../config'),
    lwm2mServer = require('../').server,
    clUtils = require('../lib/commandLineUtils'),
    separator = '\n\n\t';

function handleResult(message) {
    return function(error) {
        if (error) {
            clUtils.handleError(error);
        } else {
            console.log('Success: %s', message);
        }
    };
}

function start() {
    lwm2mServer.start(config, handleResult('COAP Server started.'));
}

function stop() {
    lwm2mServer.stop(config, handleResult('COAP Server stopped.'));
}

var commands = {
    'start': {
        parameters: [],
        description: '\tStarts a new Lightweight M2M server listening in the prefconfigured port.',
        handler: start
    },
    'stop': {
        parameters: [],
        description: '\tStops the current LWTM2M Server running.',
        handler: stop
    },
    'list': {
        parameters: [],
        description: '\tList all the devices connected to the server.',
        handler: clUtils.printName('list')
    },
    'write': {
        parameters: ['deviceId', 'resourceId', 'resourceValue'],
        description: '\tWrites the given value to the resource indicated by the URI (in LWTM2M format) in the given' +
            'device.',
        handler: clUtils.printName('write')
    },
    'unset': {
        parameters: ['deviceId', 'resourceId'],
        description: '\tReads the value of the resource indicated by the URI (in LWTM2M format) in the given device.',
        handler: clUtils.printName('read')
    },
    'discover': {
        parameters: ['deviceId', 'resourceId'],
        description: '\tSends a discover order for the given resource (defined with a LWTM2M URI) to the given device.',
        handler: clUtils.printName('discover')
    },
    'cancel': {
        parameters: ['deviceId', 'resourceId'],
        description: '\tCancel the discover order for the given resource (defined with a LWTM2M URI) ' +
            'to the given device.',
        handler: clUtils.printName('cancel')
    },
    'config': {
        parameters: [],
        description: '\tPrint the current config.',
        handler: clUtils.showConfig(config, 'server')
    }
};

clUtils.initialize(commands);
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

var readline = require('readline'),
    config = require('../config'),
    lwm2mClient = require('../').client,
    async = require('async'),
    separator = '\n\n\t';

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function printName(name) {
    return function() {
        console.log('Executing: %s', name);
        rl.prompt();
    }
}

function showHelp() {
    var keyList = Object.keys(commands);

    console.log('\n');

    for (var i = 0; i < keyList.length; i++) {
        var parameters = '';

        for (var j = 0; j < commands[keyList[i]].parameters.length; j++) {
            parameters += '<' + commands[keyList[i]].parameters[j] + '> ';
        }

        console.log("%s %s \n\n%s\n", keyList[i], parameters, commands[keyList[i]].description);
    }
}

function executeCommander(command) {
    if (command[0]=='help') {
        showHelp();
    } else if (commands[command[0]]) {
        if (command.length -1 != commands[command[0]].parameters.length) {
            console.log('Wrong number of parameters. Expected: %s', JSON.stringify(commands[command[0]].parameters));
        } else {
            commands[command[0]].handler(command.slice(1));
        }
    } else if (command[0] == '') {
        console.log('\n');
    } else {
        console.log('Unrecognized command');
    }
    rl.prompt();
}

var commands = {
    'start': {
        parameters: [],
        description: '\tStarts a new Lightweight M2M server listening in the prefconfigured port.',
        handler: printName('start')
    },
    'stop': {
        parameters: [],
        description: '\tStops the current LWTM2M Server running.',
        handler: printName('stop')
    },
    'list': {
        parameters: [],
        description: '\tList all the devices connected to the server.',
        handler: printName('list')
    },
    'write': {
        parameters: ['deviceId', 'resourceId', 'resourceValue'],
        description: '\tWrites the given value to the resource indicated by the URI (in LWTM2M format) in the given' +
            'device.',
        handler: printName('write')
    },
    'unset': {
        parameters: ['deviceId', 'resourceId'],
        description: '\tReads the value of the resource indicated by the URI (in LWTM2M format) in the given device.',
        handler: printName('read')
    },
    'discover': {
        parameters: ['deviceId', 'resourceId'],
        description: '\tSends a discover order for the given resource (defined with a LWTM2M URI) to the given device.',
        handler: printName('discover')
    },
    'cancel': {
        parameters: ['deviceId', 'resourceId'],
        description: '\tCancel the discover order for the given resource (defined with a LWTM2M URI) ' +
            'to the given device.',
        handler: printName('cancel')
    }
};

function initialize() {
    rl.setPrompt('\033[36mLWM2M-Server> \033[0m');
    rl.prompt();

    rl.on('line', function (cmd) {
        executeCommander(cmd.split(' '));
    });
}

initialize();
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

var commands = {
    'create': {
        parameters: ['objectUri'],
        description: '\tCreate a new object. The object is specified using the /type/id OMA notation.',
        handler: printName('create')
    },
    'remove': {
        parameters: ['objectUri'],
        description: '\tRemove an object. The object is specified using the /type/id OMA notation.',
        handler: printName('remove')
    },
    'set': {
        parameters: ['objectUri', 'resourceId', 'resourceValue'],
        description: '\tSet the value for a resource. If the resource does not exist, it is created.',
        handler: printName('set')
    },
    'delete': {
        parameters: ['objectUri', 'resourceId'],
        description: '\tRemoves a resource.',
        handler: printName('remove')
    },
    'list': {
        parameters: ['objectUri'],
        description: '\tList all the available objects along with its resource names and values.',
        handler: printName('list')
    }
};

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
        if (command.length -1 < commands[command[0]].parameters.length) {
            console.log('Wrong number of parameters');
        } else {
            commands[command[0]].handler(command.slice(1));
        }
    } else {
        console.log('Unrecognized command');
    }
    rl.prompt();
}

function initialize() {
    rl.setPrompt('\033[36mLWM2M-Client> \033[0m');
    rl.prompt();

    rl.on('line', function (cmd) {
        executeCommander(cmd.split(' '));
    });
}

initialize();
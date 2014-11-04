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

var readline = require('readline'),
    config = require('../config'),
    lwm2mClient = require('../').client,
    async = require('async'),
    clUtils = require('../lib/commandLineUtils'),
    separator = '\n\n\t';

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showHelp(commands) {
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

function executeCommander(command, commands) {
    if (command[0]=='help') {
        showHelp(commands);
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

function showConfig(config, branch) {
    return function () {
        console.log('\Config:\n--------------------------------\n\n%s', JSON.stringify(config[branch], null, 4));
    };
}

function initialize(commands) {
    rl.setPrompt('\033[36mLWM2M-Server> \033[0m');
    rl.prompt();

    rl.on('line', function (cmd) {
        executeCommander(cmd.split(' '), commands);
    });
}

function printName(name) {
    return function() {
        console.log('Executing: %s', name);
        rl.prompt();
    }
}

exports.showHelp = showHelp;
exports.executeCommander = executeCommander;
exports.showConfig = showConfig;
exports.initialize = initialize;
exports.printName = printName;
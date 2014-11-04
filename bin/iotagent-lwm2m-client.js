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
    clUtils = require('../lib/commandLineUtils'),
    lwm2mClient = require('../').client,
    async = require('async'),
    separator = '\n\n\t';

function handleError(error) {
    console.log('\nError:\n--------------------------------\nCode: %s\nMessage: %s\n\n', error.name, error.message);
}

function printObject(result) {
    var resourceIds = Object.keys(result.attributes);
    console.log('\nObject:\n--------------------------------\nObjectType: %s\nObjectId: %s\nObjectUri: %s',
        result.objectType, result.objectId, result.objectUri);

    if (resourceIds.length > 0) {
        console.log('\nAttributes:');
        for (var i=0; i < resourceIds.length; i++) {
            console.log('\t-> %s: %s', resourceIds[i], result.attributes[resourceIds[i]]);
        }
        console.log('\n');
    }
}

function handleObjectFunction(error, result) {
    if (error) {
        handleError(error);
    } else {
        printObject(result);
    }
}

function create(command) {
    lwm2mClient.registry.create(command[0], handleObjectFunction);
}

function get(command) {
    lwm2mClient.registry.get(command[0], handleObjectFunction);
}

function remove(command) {
    lwm2mClient.registry.remove(command[0], handleObjectFunction);
}

function set(command) {
    lwm2mClient.registry.setAttribute(command[0], command[1], command[2], handleObjectFunction);
}

function unset(command) {
    lwm2mClient.registry.unsetAttribute(command[0], command[1], handleObjectFunction);
}

function list() {
    lwm2mClient.registry.list(function(error, objList) {
        if (error){
            handleError(error);
        } else {
            console.log('\nList:\n--------------------------------\n');
            for (var i=0; i < objList.length; i++) {
                console.log('\t-> ObjURI: %s / Obj Type: %s / Obj ID: %s / Resource Num: %d',
                    objList[i].objectUri, objList[i].objectType, objList[i].objectId,
                    Object.keys(objList[i].attributes).length);
            }
        }
    });
}

var commands = {
    'create': {
        parameters: ['objectUri'],
        description: '\tCreate a new object. The object is specified using the /type/id OMA notation.',
        handler: create
    },
    'get': {
        parameters: ['objectUri'],
        description: '\tGet all the information on the selected object.',
        handler: get
    },
    'remove': {
        parameters: ['objectUri'],
        description: '\tRemove an object. The object is specified using the /type/id OMA notation.',
        handler: remove
    },
    'set': {
        parameters: ['objectUri', 'resourceId', 'resourceValue'],
        description: '\tSet the value for a resource. If the resource does not exist, it is created.',
        handler: set
    },
    'unset': {
        parameters: ['objectUri', 'resourceId'],
        description: '\tRemoves a resource from the selected object.',
        handler: unset
    },
    'list': {
        parameters: [],
        description: '\tList all the available objects along with its resource names and values.',
        handler: list
    },
    'connect': {
        parameters: ['host port'],
        description: '\tConnect to the server in the selected host and port.',
        handler: clUtils.printName('connecting')
    },
    'disconnect': {
        parameters: [],
        description: '\tDisconnect from the current server.',
        handler: clUtils.printName('disconnecting')
    },
    'config': {
        parameters: [],
        description: '\tPrint the current config.',
        handler: clUtils.showConfig(config, 'client')
    }
};

clUtils.initialize(commands);
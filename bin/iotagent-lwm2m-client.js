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
    clUtils = require('command-node'),
    lwm2mClient = require('../').client,
    async = require('async'),
    globalDeviceInfo,
    separator = '\n\n\t';

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
        clUtils.handleError(error);
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
    lwm2mClient.registry.setResource(command[0], command[1], command[2], handleObjectFunction);
}

function unset(command) {
    lwm2mClient.registry.unsetResource(command[0], command[1], handleObjectFunction);
}

function list() {
    lwm2mClient.registry.list(function(error, objList) {
        if (error){
            clUtils.handleError(error);
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

function handleWrite(objectType, objectId, resourceId, value, callback) {
    console.log('\nValue written:\n--------------------------------\n');
    console.log('-> ObjectType: %s', objectType);
    console.log('-> ObjectId: %s', objectId);
    console.log('-> ResourceId: %s', resourceId);
    console.log('-> Written value: %s', value);
    clUtils.prompt();

    callback(null);
}

function handleExecute(objectType, objectId, resourceId, value, callback) {
    console.log('\nCommand executed:\n--------------------------------\n');
    console.log('-> ObjectType: %s', objectType);
    console.log('-> ObjectId: %s', objectId);
    console.log('-> ResourceId: %s', resourceId);
    console.log('-> Command arguments: %s', value);
    clUtils.prompt();

    callback(null);
}

function handleRead(objectType, objectId, resourceId, value, callback) {
    console.log('\nValue read:\n--------------------------------\n');
    console.log('-> ObjectType: %s', objectType);
    console.log('-> ObjectId: %s', objectId);
    console.log('-> ResourceId: %s', resourceId);
    console.log('-> Read Value: %s', value);
    clUtils.prompt();

    callback(null);
}

function setHandlers(deviceInfo) {
    lwm2mClient.setHandler(deviceInfo.serverInfo, 'write', handleWrite);
    lwm2mClient.setHandler(deviceInfo.serverInfo, 'execute', handleExecute);
    lwm2mClient.setHandler(deviceInfo.serverInfo, 'read', handleRead);
}

function connect(command) {
    var url;

    console.log('\nConnecting to the server. This may take a while.\n');

    if (command[2] === '/') {
        url = command[2];
    }

    lwm2mClient.register(command[0], command[1], command[3], command[2], function (error, deviceInfo) {
        if (error) {
            clUtils.handleError(error);
        } else {
            globalDeviceInfo = deviceInfo;
            setHandlers(deviceInfo);
            console.log('\nConnected:\n--------------------------------\nDevice location: %s', deviceInfo.location);
            clUtils.prompt();
        }
    });
}

function disconnect(command) {
    if (globalDeviceInfo) {
        lwm2mClient.unregister(globalDeviceInfo, function(error) {
            if (error) {
                clUtils.handleError(error);
            } else {
                console.log('\nDisconnected:\n--------------------------------\n');
                clUtils.prompt();
            }
        });
    } else {
        console.error('\nCouldn\'t find device information (the connection may have not been completed).');
    }
}

function updateConnection(command) {
    if (globalDeviceInfo) {
        lwm2mClient.update(globalDeviceInfo, function(error, deviceInfo) {
            if (error) {
                clUtils.handleError(error);
            } else {
                globalDeviceInfo = deviceInfo;
                setHandlers(deviceInfo);
                console.log('\Information updated:\n--------------------------------\n');
                clUtils.prompt();
            }
        });
    } else {
        console.error('\nCouldn\'t find device information (the connection may have not been completed).');
    }
}

function quit(command) {
    console.log('\nExiting client\n--------------------------------\n');
    process.exit();
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
        parameters: ['host', 'port', 'endpointName', 'url'],
        description: '\tConnect to the server in the selected host and port, using the selected endpointName.',
        handler: connect
    },
    'updateConnection': {
        parameters: [],
        description: '\tUpdates the current connection to a server.',
        handler: updateConnection
    },
    'disconnect': {
        parameters: [],
        description: '\tDisconnect from the current server.',
        handler: disconnect
    },
    'config': {
        parameters: [],
        description: '\tPrint the current config.',
        handler: clUtils.showConfig(config, 'client')
    },
    'quit': {
        parameters: [],
        description: '\tExit the client.',
        handler: quit
    }
};

lwm2mClient.init(require('../config'));

clUtils.initialize(commands, 'LWM2M-Client> ');

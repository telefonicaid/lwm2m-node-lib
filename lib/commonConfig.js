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
 * please contact with::daniel.moranjimenez@telefonica.com
 *
 * Modified by: Federico M. Facca - Martel Innovate
 */

'use strict';

var config = {},
    logger = require('logops'),
    registry,
    context = {
        op: 'LWM2MLib.CommonConfig'
    };

function anyIsSet(variableSet) {
    for (var i = 0; i < variableSet.length; i++) {
        if (process.env[variableSet[i]]) {
            return true;
        }
    }

    return false;
}

/**
 * Looks for environment variables that could override configuration values.
 */
function processEnvironmentVariables() {
    var environmentVariables = [
            'LWM2M_PORT',
            'LWM2M_PROTOCOL',
            'LWM2M_REGISTRY_TYPE',
            'LWM2M_LOG_LEVEL',
            'LWM2M_MONGO_HOST',
            'LWM2M_MONGO_PORT',
            'LWM2M_MONGO_DB',
            'LWM2M_MONGO_REPLICASET',
            'LWM2M_WRITE_FORMAT',
            'LWM2M_DEFAULT_ACCEPT_FORMAT'
        ],
        mongoVariables = [
            'LWM2M_MONGO_HOST',
            'LWM2M_MONGO_PORT',
            'LWM2M_MONGO_DB',
            'LWM2M_MONGO_REPLICASET'
        ];

    for (var i = 0; i < environmentVariables.length; i++) {
        if (process.env[environmentVariables[i]]) {
            logger.info(context, 'Setting %s to environment value: %s',
                environmentVariables[i], process.env[environmentVariables[i]]);
        }
    }

    if (process.env.LWM2M_PORT) {
        config.port = process.env.LWM2M_PORT;
    }

    if (process.env.LWM2M_PROTOCOL) {
        config.serverProtocol = process.env.LWM2M_PROTOCOL;
    }

    if (process.env.LWM2M_REGISTRY_TYPE) {
        config.deviceRegistry = {};
        config.deviceRegistry.type = process.env.LWM2M_REGISTRY_TYPE;
    }

    if (process.env.LWM2M_LOG_LEVEL) {
        config.logLevel = process.env.LWM2M_LOG_LEVEL;
        logger.setLevel(process.env.LWM2M_LOG_LEVEL);
    }

    if (process.env.LWM2M_WRITE_FORMAT) {
        config.writeFormat = process.env.LWM2M_WRITE_FORMAT;
    }

    if (process.env.LWM2M_DEFAULT_ACCEPT_FORMAT) {
        config.defaultAcceptFormat = process.env.LWM2M_DEFAULT_ACCEPT_FORMAT;
    }

    if (anyIsSet(mongoVariables)) {
        config.mongodb = {};
    }

    if (process.env.LWM2M_MONGO_HOST) {
        config.mongodb.host = process.env.LWM2M_MONGO_HOST;
    }

    if (process.env.LWM2M_MONGO_PORT) {
        config.mongodb.port = process.env.LWM2M_MONGO_PORT;
    }

    if (process.env.LWM2M_MONGO_DB) {
        config.mongodb.db = process.env.LWM2M_MONGO_DB;
    }

    if (process.env.LWM2M_MONGO_REPLICASET) {
        config.mongodb.replicaSet = process.env.LWM2M_MONGO_REPLICASET;
    }

    if (process.env.LWM2M_MONGO_RETRIES) {
        config.mongodb.retries = process.env.LWM2M_MONGO_RETRIES;
    }

}

function setConfig(newConfig) {
    config = newConfig;

    if (config.logLevel) {
        logger.setLevel(config.logLevel);
    }

    processEnvironmentVariables();
}

function getConfig() {
    return config;
}

function setRegistry(newRegistry) {
    registry = newRegistry;
}

function getRegistry() {
    return registry;
}

exports.setConfig = setConfig;
exports.getConfig = getConfig;
exports.setRegistry = setRegistry;
exports.getRegistry = getRegistry;


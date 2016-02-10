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
 */
'use strict';

/**
 * This module sets up the connection with the mongodb through mongoose. This connection will be used
 * in mongoose schemas to persist objects.
 */

var mongoose = require('mongoose'),
    defaultDb;

function loadModels() {
    require('./Device').load(defaultDb);
}

/**
 * Creates a new connection to the Mongo DB.
 *
 */
function init(host, db, callback) {
    /*jshint camelcase:false */

    defaultDb = mongoose.createConnection(host, db);
    defaultDb.on('error', function mongodbErrorHandler(error) {
        throw new Error(error);
    });

    loadModels();

    callback(null);
}
exports.init = init;
exports.db = defaultDb;

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

var libLwm2m2 = require('../..').server,
    utils = require('./testUtils'),
    config = require('../../config'),
    async = require('async');

describe('Client update registration interface', function() {
    var deviceLocation;

    function registerHandlers(callback) {
        libLwm2m2.setHandler('registration', function(endpoint, lifetime, version, binding, innerCb) {
            innerCb();
        });

        libLwm2m2.setHandler('updateRegistration', function(object, innerCb) {
            innerCb();
        });

        callback();
    }

    beforeEach(function (done) {
        async.series([
            async.apply(libLwm2m2.start, config),
            registerHandlers,
            async.apply(utils.registerClient, 'ROOM001')
        ], function (error, results) {
            deviceLocation = results[2];
            done();
        });
    });

    afterEach(function(done) {
        libLwm2m2.stop(done);
    });

    describe('When a correct cliente registration update request arrives', function() {
        var updateRequest = {
            host: 'localhost',
            port: config.server.port,
            method: 'PUT',
            query: 'lt=86400&b=U'
        };

        beforeEach(function() {
            updateRequest.pathname = deviceLocation;
        });

        it('should return a 2.04 Changed code', utils.checkCode(updateRequest, '', '2.04'));
    });
});
/*
 * Copyright 2017 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of lwm2m-node-lib
 *
 * lwm2m-node-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * lwm2m-node-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with lwm2m-node-lib.
 * If not, seehttp://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 *
 * Author: Alexandre Moreno <alex_moreno@tutk.com>
 */

'use strict';

var Schema = require('./schema');

var schema = new Schema('LWM2M Server', {
  serverId:     { type: Number, id: 0, required: true },
  lifetime:     { type: Number, id: 1, required: true },
  notifStoring: { type: Boolean, id: 6, required: true},
  binding:      { type: String, id:7, required: true }
});

schema.range('serverId', { min: 1, max: 65535 });

// current binding and queue mode of LWM2M Client
schema.enum('binding', ['U', 'UQ', 'S', 'SQ', 'US', 'UQS']);

module.exports = schema;

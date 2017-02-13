/*
 * Copyright 2017 Alexandre Moreno <alex_moreno@tutk.com>
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
 */

'use strict';

var Schema = require('./schema');

// add remaining optional resources for completeness
module.exports = new Schema('Device', {
  manufacturer: { type: String, id: 0 },
  deviceType:   { type: String, id: 17 },
  modelNumber:  { type: String, id: 1 },
  serialNumber: { type: String, id: 2 },
  hardwareVer:  { type: String, id: 18 },
  firmwareVer:  { type: String, id: 3 },
  softwareVer:  { type: String, id: 19 },
  powerSrcs:    [{ type: Number, id: 6 }],
  srcVoltage:   [{ type: Number, id: 7 }],
  srcCurrent:   [{ type: Number, id: 8 }],
  batteryLevel: { type: Number, id: 9 },
  memoryFree:   { type: Number, id: 10 },
  errorCode:    [{ type: Number, id: 11 }],
  currentTime:  { type: Number, id: 13 },
  utcOffset:    { type: String, id: 14 },
  timeZone:     { type: String, id: 15 }
});


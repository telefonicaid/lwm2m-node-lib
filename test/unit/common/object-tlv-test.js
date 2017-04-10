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

var should = require('should'), // jshint ignore:line
    tlv = require('../../../lib/services/object/tlv'),
    deviceSchema = require('../../../lib/services/object/device');

var object = { 
  manufacturer: 'Open Mobile Alliance',
  modelNumber: 'Lightweight M2M Client',
  serialNumber: '345000123',
  firmwareVer: '1.0',
  powerSrcs: [ 1, 5 ],
  srcVoltage: [ 3800, 5000 ],
  srcCurrent: [ 125, 900 ],
  batteryLevel: 100,
  memoryFree: 15,
  errorCode: [ 0 ],
  currentTime: 1367491215,
  utcOffset: '+02:00',
  binding: 'U' 
};

// The total payload size with the TLV encoding is 121 bytes
// Copied verbatim from the spec.
var payload = new Buffer([
  0xc8, 0x00, 0x14, 0x4f, 0x70, 0x65, 0x6e, 0x20, 0x4d, 0x6f,
  0x62, 0x69, 0x6c, 0x65, 0x20, 0x41, 0x6c, 0x6c, 0x69, 0x61, 
  0x6e, 0x63, 0x65, 0xc8, 0x01, 0x16, 0x4c, 0x69, 0x67, 0x68, 
  0x74, 0x77, 0x65, 0x69, 0x67, 0x68, 0x74, 0x20, 0x4d, 0x32,
  0x4d, 0x20, 0x43, 0x6c, 0x69, 0x65, 0x6e, 0x74, 0xc8, 0x02, 
  0x09, 0x33, 0x34, 0x35, 0x30, 0x30, 0x30, 0x31, 0x32, 0x33, 
  0xc3, 0x03, 0x31, 0x2e, 0x30, 0x86, 0x06, 0x41, 0x00, 0x01, 
  0x41, 0x01, 0x05, 0x88, 0x07, 0x08, 0x42, 0x00, 0x0e, 0xd8, 
  0x42, 0x01, 0x13, 0x88, 0x87, 0x08, 0x41, 0x00, 0x7d, 0x42, 
  0x01, 0x03, 0x84, 0xc1, 0x09, 0x64, 0xc1, 0x0a, 0x0f, 0x83, 
  0x0b, 0x41, 0x00, 0x00, 0xc4, 0x0d, 0x51, 0x82, 0x42, 0x8f, 
  0xc6, 0x0e, 0x2b, 0x30, 0x32, 0x3a, 0x30, 0x30, 0xc1, 0x10,
  0x55 ]);

describe('De/serializing LWM2M Objects from/into TLV', function() {
  describe('serialize', function() {
    it('should return a valid payload', function() {
      var dev = tlv.serialize(object, deviceSchema);

      dev.should.be.an.instanceOf(Buffer);
      dev.toString('hex').should.equal(payload.toString('hex'));
    });
  });

  describe('parse', function() {
    it('should return a valid object', function() {
      var dev = tlv.parse(payload, deviceSchema);

      dev.should.be.eql(object);
    });
  });
});



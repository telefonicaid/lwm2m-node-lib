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
    senml = require('../../../lib/services/object/senml'),
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
  timeZone: 'U' 
};

var payload = '{"e":[' +
  '{"n":"0","sv":"Open Mobile Alliance"},' +
  '{"n":"1","sv":"Lightweight M2M Client"},' +
  '{"n":"2","sv":"345000123"},' +
  '{"n":"3","sv":"1.0"},' +
  '{"n":"6/0","v":1},' +
  '{"n":"6/1","v":5},' +
  '{"n":"7/0","v":3800},' +
  '{"n":"7/1","v":5000},' +
  '{"n":"8/0","v":125},' +
  '{"n":"8/1","v":900},' +
  '{"n":"9","v":100},' +
  '{"n":"10","v":15},' +
  '{"n":"11/0","v":0},' +
  '{"n":"13","v":1367491215},' +
  '{"n":"14","sv":"+02:00"},' +
  '{"n":"15","sv":"U"}]}';

describe('De/serializing LWM2M Objects from/into JSON', function() {

  describe('serialize', function() {
    it('should return a valid payload', function() {
      var dev = senml.serialize(object, deviceSchema);

      dev.should.equal(payload);
    });
  });

  describe('parse', function() {
    it('should return an object', function() {
      var dev = senml.parse(payload, deviceSchema);

      dev.should.be.an.Object().and.not.empty();
    });

    it('should strictly return matching resources from schema', function() {
      var dev = senml.parse(payload, deviceSchema),
          keys = Object.keys(deviceSchema.resources);

      Object.keys(dev).should.matchEach(function(it) { 
        return it.should.be.oneOf(keys);
      });
    });
  });

});


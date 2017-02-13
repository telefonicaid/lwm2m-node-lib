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

var should = require('should'), // jshint ignore:line
    Schema = require('../../../').Schema;

describe('LWM2M Object Schema', function() {

  describe('constructor', function() {
    it('should throw when a resource definition is not correct', function() {
      var def = {
        a: { type: String, id: 0 },
        b: { bad: 'value' }
      };

      function schema() { 
        new Schema('test', def);
      }
      
      schema.should.throw(TypeError);
    });

    it('should throw when presented with invalid resource type', function() {
      var def = {
        a: { type: String, id: 0 },
        b: { type: RegExp, id: 1 }
      };

      function schema() { 
        new Schema('test', def);
      }
      
      schema.should.throw(TypeError);
    });

  });

  describe('validate', function() {

    it('should be ok when an object matches an schema', function() {
      var def = {
        a: { type: String, id: 0 },
        b: { type: Number, id: 1 }
      };

      var schema = new Schema('test', def);

      function validate() {
        return schema.validate({ a: 'foo', b: 3 });
      }
      
      validate.should.not.throw(TypeError);
    });

    it('should be ok when an object uses Object IDs as keys', function() {
      var def = {
        a: { type: String, id: 0 },
        b: { type: Number, id: 1 }
      };

      var schema = new Schema('test', def);

      function validate() {
        return schema.validate({ 0: 'foo', 1: 3 });
      }
      
      validate.should.not.throw(TypeError);
    });

    it('should throw when an object does not match schema', function() {
      var def = {
        a: { type: String, id: 0 },
        b: { type: Number, id: 1 },
        c: [{ type: Boolean, id: 2 }]
      };

      var schema = new Schema('test', def);

      function validate() {
        return schema.validate({ a: 'foo', b: false });
      }
      
      validate.should.throw(TypeError);

      function validate2() {
        return schema.validate({ a: 'foo', c: [1,2,3] });
      }
      
      validate2.should.throw(TypeError);
    });

    it('should throw when missing a required resource', function() {
      var def = {
        a: { type: String, id: 0 },
        b: { type: Number, id: 1, required: true }
      };

      var schema = new Schema('test', def);

      function validate() {
        return schema.validate({ a: 'foo' });
      }
      
      validate.should.throw(TypeError);
    });
  });
});


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

var logger = require('logops'),
    context = {
        op: 'LWM2MLib.BootstrapServer'
    };

function serializeToString(obj, schema) {
  var result = { e: [] },
      keys = Object.keys(obj),
      res = schema.resources;

  function append(arr, key, value) {
    var types = {
      String: function() {
        arr.push({ n: key, sv: value });
      },
      Number: function() {
        arr.push({ n: key, v: value });
      },
      Boolean: function() {
        arr.push({ n: key, bv: value });
      },
      Buffer: function() {
        arr.push({ 
          n: key, 
          sv: value.toString('base64') 
        });
      },
      Array: function() {
        for (var i = 0; i < value.length; i++) {
          append(arr, key + '/' + i, value[i]);
        }
      }
    };

    function skip () {
      logger.warn(context, 'Skipping resource with invalid type %s', typeof value);
    }

    var type = Object.prototype.toString.call(value).slice(8, -1);

    if (Buffer.isBuffer(value)) {
      type = Buffer.name;
    }

    (types[type] || skip)();
    
    return arr;
  }


  if (keys.length === 1) { // single resource
    schema.validateResource(keys[0], obj[keys[0]]);
  } else {                // whole object
    schema.validate(obj);
  }

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i],
        id = res[key] ? res[key].id : key;

    append(result.e, String(id), obj[key]);
  }

  return JSON.stringify(result);
}

function parse(payload, schema) {
  var result = {},
      obj = {};

  function append(obj, key, type, value) {
    var types = {
      String: function() {
        obj[key] = value.sv;
      },
      Number: function() {
        obj[key] = value.v;
      },
      Boolean: function() {
        obj[key] = value.bv;
      },
      Buffer: function() {
        obj[key] = Buffer.from(value.sv, 'base64');
      },
    };


    if (Array.isArray(type)) {
      var id = value.n.split('/')[1];

      if (!obj[key]) {
        obj[key] = [];
      }

      append(obj[key], id, type[0], value);
    } else {
      (types[type])();
    }

    if (obj[key] === undefined) {
      throw new Error('JSON payload does not match ' + 
        schema.name + ' definition');
    }

    return obj;
  }

  obj = JSON.parse(payload);

  if (!Array.isArray(obj.e)) {
    throw new Error('Invalid JSON payload');
  }

  for (var i = 0; i < obj.e.length; ++i) {
    var key, type;

    key = schema.resourceNameById(obj.e[i].n.split('/')[0]);

    // skip resources not defined in schema.
    if (!key) {
      continue; 
    }

    type = schema.resources[key].type;

    append(result, key, type, obj.e[i]);
  }

  return result;
}

exports.serialize = serializeToString;
exports.parse = parse;

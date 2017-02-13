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

function matches(val, type) {
  function typeOf(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
  }

  if (type === 'Buffer') {
    return Buffer.isBuffer(val);
  }

  if (!Array.isArray(type)) {
    return type === typeOf(val);
  }

  if (Array.isArray(val)) {
    return matches(val[0], type[0]);
  }

  return false;
}

function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function validResourceType(type) {
  return ['String', 'Number', 'Boolean', 'Buffer'].indexOf(type) > -1;
}

function validateProps(type, id) {
  return validResourceType(type) && typeof id === 'number';
}



function Schema(name, resources) {
  this.name = name;
  this.resources = {};
  this.resourceNames = {};

  for (var key in resources) {
    if (resources.hasOwnProperty(key)) {

      var ok = false,
          res = resources[key];

      if (isObject(res)) {
        ok = validateProps(res.type.name, res.id);

        this.resources[key] = {
          type: res.type.name,
          id: res.id,
          required: res.required || false
        };

        this.resourceNames[res.id] = key;
      }

      if (Array.isArray(res)) {
        var type = res[0].type,
            id = res[0].id,
            required = res[0].required || false;

        ok = validateProps(type.name, id);

        this.resources[key] = { 
          type: [type.name], 
          id: id, 
          required: required || false
        };

        this.resourceNames[id] = key;
      }

      if (!ok) {
        throw new TypeError('Invalid resource `' + key + '`');
      }
    }
  }
}

Schema.prototype.resourceNameById = function(id) {
  return this.resourceNames[id];
};

Schema.prototype.validateResource = function(key, val) {
  var name = key;

  if (!this.resources[key]) {
    name = this.resourceNameById(key);
  }

  if (!name) {
    throw new TypeError('Invalid resource `' + key + '`');
  }

  var type = this.resources[name].type;
  var ok = matches(val, type);

  if (!ok) {
    throw new TypeError('Invalid type for `' + key + '`');
  }
};

Schema.prototype.validate = function(obj) {
  var keys = Object.keys(this.resources);

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i],
        type = this.resources[key].type,
        id = this.resources[key].id,
        required = this.resources[key].required,
        val, ok;

    val = obj[key] === undefined ? obj[id] : obj[key];
    ok = matches(val, type);

    if (val !== undefined && !ok) {
      throw new TypeError('Invalid resource `' + key + '`');
    }

    if (required && !ok) {
      throw new TypeError('Missing resource `' + key + '`');
    }
  }
};

module.exports = Schema;

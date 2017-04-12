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

var logger = require('logops'),
    context = {
        op: 'LWM2MLib.Object'
    };

/*
 * length in bytes of a number
 */
function length(val) {
  if (val < 2) {
    return 1;
  }
  return Math.ceil(Math.log(val) * Math.LOG2E / 8);
}

function readHeader(buf, offset, tlv) {
  var type, id, len;
  var header;
    
  header = buf.readUInt8(offset);
  offset += 1;

  type = header >> 6;

  if (header & 0x20) {
    id = buf.readUInt16BE(offset);
    offset += 2;
  } else {
    id = buf.readUInt8(offset);
    offset += 1;
  }

  len = header & 0x7;

  if (!len) {
    switch ((header & 0x18) >> 3) {
      case 1:
        len = buf.readUInt8(offset);
        offset += 1;
        break;
      case 2:
        len = buf.readUInt16BE(offset);
        offset += 2;
        break;
      case 3:
        len = buf.readUInt16BE(offset);
        len = buf.readUInt8(offset);
        offset += 3;
        break;
    }
  }


  tlv.len = len;
  tlv.id = id;
  tlv.type = type;

  return offset;
}


function writeHeader(buf, offset, idType, id, len) {
  function tlvType(type, id, len) {
    var byte = type << 6;

    if (id > 0xff) {
      byte |=  0x1 << 5;
    }

    if (len < 8) {
      byte |= len;
    } else {
      byte |= length(len) << 3;
    }

    return byte;
  }

  var type = tlvType(idType, id, len);

  /* type (8-bits masked field) */
  buf.writeUInt8(type, offset);
  offset += 1;

  /* identifier (8-bit or 16-bit UInt) */
  if (type & 0x20) {
    buf.writeUInt16BE(id, offset);
    offset += 2;
  } else {
    buf.writeUInt8(id, offset);
    offset += 1;
  }
  
  /* length (0-24-bit UInt) */
  if (type & 0x18) {
    switch (length(len)) {
      case 3:
        buf.writeUInt8(len >> 0x10 & 0xff, offset);
        offset += 1;
        /* falls through */
      case 2:
        buf.writeUInt8(len >> 0x08 & 0xff, offset);
        offset += 1;
        /* falls through */
      case 1:
        buf.writeUInt8(len & 0xff, offset);
        offset += 1;
        break;
      default:
        throw new Error('Invalid resource `' + id + '`');
    }
  }

  return offset;
}

function serialize(obj, schema) {
  var buf = new Buffer(16 * 1024 /**1024*/),
      keys = Object.keys(obj),
      res = schema.resources;

  function append(buf, offset, tlv) {
    var types = {
      String: function() {
        var type = tlv.type,
            id = tlv.id,
            value = tlv.value,
            len = value.length;

        offset = writeHeader(buf, offset, type, id, len);
        buf.write(value, offset, buf.length - offset, 'utf8');
        offset += len;

        return offset;
      },
      Number: function() {
        // integer size: 1, 2, 4 or 8 bytes.
        function size(val) {
          var v = length(val);
          v--;
          v |= v >> 1;
          v |= v >> 2;
          v++;
          return v;
        }

        var type = tlv.type,
            id = tlv.id,
            value = tlv.value,
            len = size(value);

        offset = writeHeader(buf, offset, type, id, len);

        switch (len) {
          case 8:
          // 64-bit
          buf.writeInt32BE(value >> 32, offset);
          buf.writeInt32BE(value & 0xffffffff, offset);
          offset += 8;
          break;
          case 4:
          // 32-bit
          buf.writeInt32BE(value, offset);
          offset += 4;
          break;
          case 2:
          // 16-bit
          buf.writeInt16BE(value, offset);
          offset += 2;
          break;
          case 1:
          // 8-bit
          buf.writeInt8(value, offset);
          offset += 1;
          break;
        }

        return offset;
      },
      Boolean: function() {
        var type = tlv.type,
            id = tlv.id,
            value = tlv.value ? 1 : 0,
            len = 1;

        offset = writeHeader(buf, offset, type, id, len);
        buf.writeInt8(value, offset);
        offset += 1;

        return offset;
      },
      Buffer: function() {
        var type = tlv.type,
            id = tlv.id,
            value = tlv.value,
            len = value.length;

        offset = writeHeader(buf, offset, type, id, len);
        value.copy(buf, offset);
        offset += len;

        return offset;
      },
      Array: function() {
        var type = 0x2,
            id = tlv.id,
            value = tlv.value,
            len = 0;

        var tmp = new Buffer(1024);

        for (var i = 0; i < value.length; i++) {
          var tlv2 = {
            type: 0x1,
            id : i,
            value: value[i]
          };

          len = append(tmp, len, tlv2);
        }

        offset = writeHeader(buf, offset, type, id, len);
        tmp.copy(buf, offset, 0, len);
        offset += len;

        return offset;
      }
    };

    var value = tlv.value;
    var type = Object.prototype.toString.call(value).slice(8, -1);

    function skip () {
      logger.warn(context, 'Skipping resource with invalid type %s', typeof value);
    }

    if (Buffer.isBuffer(value)) {
      type = Buffer.name;
    }

    return (types[type] || skip)();
  }

  if (keys.length === 1) { // single resource
    schema.validateResource(keys[0], obj[keys[0]]);
  } else {                // whole object
    schema.validate(obj);
  }

  var len = 0;

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i],
        id = res[key] ? res[key].id : key;

    var tlv = {
      type: 0x3, // resource
      id : id,
      value: obj[key]
    };

    len = append(buf, len, tlv);
  }

  return buf.slice(0, len);
}

function parse(payload, schema) {
  function append(obj, key, type, payload, pos, len) {
    var types = {
      String: function() {
        obj[key] = payload.toString('utf8', pos, pos + len); 
        pos += len;
        return pos;
      },
      Number: function() {
        switch (len) {
          case 8:
          // 64-bit
          obj[key] = payload.readUInt32BE(pos);
          obj[key] <<= 32; 
          obj[key] |= payload.readUInt32BE(pos + 4);
          break;
          case 4:
          // 32-bit
          obj[key] = payload.readUInt32BE(pos);
          break;
          case 2:
          // 16-bit
          obj[key] = payload.readUInt16BE(pos);
          break;
          case 1:
          // 8-bit
          obj[key] = payload.readUInt8(pos);
          break;
        }

        pos += len;
        return pos;
      },
      Boolean: function() {
        obj[key] = payload.readUInt8(pos) ? true : false;
        pos += 1;
        return pos;
      },
      Buffer: function() {
        var buf = new Buffer(len);
        payload.copy(buf, 0, pos, pos + len);
        obj[key] = buf;

        pos += len;
        return pos;
      },
    };


    if (Array.isArray(type)) {
      var end = pos + len;
      var tlv = {};
      obj[key] = [];

      while (pos < end) {
        pos = readHeader(payload, pos, tlv);
        pos = append(obj[key], tlv.id, type[0], payload, pos, tlv.len);
      }

      return pos;
    } else {
      return (types[type])();
    }

  }

  var result = {};
  var pos = 0;
  var tlv = {}, key, type;

  while (pos < payload.length) {

    pos = readHeader(payload, pos, tlv);
    key = schema.resourceNameById(tlv.id);
    type = schema.resources[key].type;

    pos = append(result, key, type, payload, pos, tlv.len);
  }

  return result;
}

exports.serialize = serialize;
exports.parse = parse;

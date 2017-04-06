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


/*
 * length in bytes of a number
 */
function length(val) {
  if (val < 2) {
    return 1;
  }
  return Math.ceil(Math.log(val) * Math.LOG2E / 8);
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
      byte |= length(len) << 3
    }

    return byte;
  }

  var type = tlvType(idType, id, len);

  /* type (8-bits masked field) */
  offset = buf.writeUInt8(type, offset);

  /* identifier (8-bit or 16-bit UInt) */
  if (type & 0x20) {
    offset = buf.writeUInt16BE(id, offset);
  } else {
    offset = buf.writeUInt8(id, offset);
  }
  
  /* length (0-24-bit UInt) */
  if (type & 0x18) {
    switch (length(len)) {
      case 3:
        offset = buf.writeUInt8(len >> 0x10 & 0xff, offset);
      case 2:
        offset = buf.writeUInt8(len >> 0x08 & 0xff, offset);
      case 1:
        offset = buf.writeUInt8(len & 0xff, offset);
        break;
      default:
        throw new Error('Invalid resource `' + id + '`');
    }
  }

  return offset;
}

function serialize(obj, schema) {
  var buf = Buffer.alloc(16 * 1024 /**1024*/),
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
        offset += buf.write(value, offset, buf.length - offset, 'utf8');

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

        if (len == 8) {
          // 64-bit
          offset = buf.writeInt32BE(value >> 32, offset);
          offset = buf.writeInt32BE(value & 0xffffffff, offset);
        } else {
          offset = buf.writeUIntBE(value, offset, len);
        }

        return offset;
      },
      Boolean: function() {
        var type = tlv.type,
            id = tlv.id,
            value = tlv.value ? 1 : 0,
            len = 1;

        offset = writeHeader(buf, offset, type, id, len);
        offset = buf.writeInt8(value, offset);

        return offset;
      },
      Buffer: function() {
        var type = tlv.type,
            id = tlv.id,
            value = tlv.value,
            len = value.length;

        offset = writeHeader(buf, offset, type, id, len);
        offset += value.copy(buf, offset);

        return offset;
      },
      Array: function() {
        var type = 0x2,
            id = tlv.id,
            value = tlv.value,
            len = 0;

        var tmp = Buffer.alloc(1024);

        for (var i = 0; i < value.length; i++) {
          var tlv2 = {
            type: 0x1,
            id : i,
            value: value[i]
          };

          len = append(tmp, len, tlv2);
        }

        offset = writeHeader(buf, offset, type, id, len);
        offset += tmp.copy(buf, offset, 0, len);

        return offset;
      }
    };

    function skip () {
      logger.warn(context, 'Skipping resource with invalid type %s', typeof value);
    }

    var value = tlv.value;
    var type = Object.prototype.toString.call(value).slice(8, -1);

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

  var len = 0

  for (var i = 0; i < keys.length; ++i) {
    var key = keys[i],
        id = res[key] ? res[key].id : key;

    var tlv = {
      type: 0x3, // resource
      id : id,
      value: obj[key]
    }

    len = append(buf, len, tlv);
  }

  return buf.slice(0, len);
}

exports.serialize = serialize;

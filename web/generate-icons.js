import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function crc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function createPNG(size) {
  const width = size;
  const height = size;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(17);
  ihdrData.write('IHDR', 0);
  ihdrData.writeUInt32BE(width, 4);
  ihdrData.writeUInt32BE(height, 8);
  ihdrData[12] = 8;
  ihdrData[13] = 2;
  ihdrData[14] = 0;
  ihdrData[15] = 0;
  ihdrData[16] = 0;

  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc(ihdrData), 0);

  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const offset = y * (1 + width * 3);
    rawData[offset] = 0;
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      const cx = width / 2, cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < width * 0.3) {
        rawData[px] = 129;
        rawData[px + 1] = 140;
        rawData[px + 2] = 248;
      } else {
        rawData[px] = 30;
        rawData[px + 1] = 27;
        rawData[px + 2] = 75;
      }
    }
  }

  const compressed = deflateSync(rawData);

  const idatType = Buffer.from('IDAT');
  const idatLen = Buffer.alloc(4);
  idatLen.writeUInt32BE(compressed.length, 0);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc(Buffer.concat([idatType, compressed])), 0);

  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

  return Buffer.concat([signature, ihdrLen, ihdrData, ihdrCrc, idatLen, idatType, compressed, idatCrc, iend]);
}

writeFileSync('public/icon-192.png', createPNG(192));
writeFileSync('public/icon-512.png', createPNG(512));
console.log('Icons generated');

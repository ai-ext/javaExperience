import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rasterDimensions } from './raster-size.mjs';

// sourceSnapshot의 실제 PNG에서 추출한 signature와 IHDR 33바이트만 고정한 파서 단위 fixture.
const png = Buffer.from('89504e470d0a1a0a0000000d4948445200000600000004000802000000a8130515', 'hex');
// sips 실측: 실제 JPEG 모바일 캡처 360×2801.
const jpeg = readFileSync(new URL('../../docs/design/d02-2026-10-20/captures/mobile-url.jpg', import.meta.url));
assert.deepEqual(rasterDimensions(png), { format: 'png', width: 1536, height: 1024 });
assert.deepEqual(rasterDimensions(jpeg), { format: 'jpeg', width: 360, height: 2801 });
assert.deepEqual(rasterDimensions(png), { format: 'png', width: 1536, height: 1024 }, '33바이트 IHDR만 읽음');

// 픽셀 데이터가 아닌 작은 JPEG 헤더 표본: APP segment 뒤 SOF의 실제 width/height 위치.
const sofMarkers = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf];
function jpegHeader(marker = 0xc0) {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0x12, 0x34,
    0xff, 0xff, marker, 0, 11, 8, 0, 17, 0, 29, 1, 1, 0x11, 0]);
}
for (const marker of sofMarkers) assert.deepEqual(rasterDimensions(jpegHeader(marker)), { format: 'jpeg', width: 29, height: 17 });

function rejects(buffer, reason) {
  assert.throws(() => rasterDimensions(buffer), error => error instanceof Error && !(error instanceof RangeError) && /header|format/i.test(error.message), reason);
}
for (const length of [0, 1, 7, 8, 16, 24, 32]) rejects(png.subarray(0, length), '잘린 PNG 헤더 ' + length);
const badSignature = Buffer.from(png); badSignature[1] = 0; rejects(badSignature, '잘못된 signature');
const badChunk = Buffer.from(png); badChunk[12] = 0; rejects(badChunk, '첫 chunk가 IHDR 아님');
const badLength = Buffer.from(png); badLength.writeUInt32BE(12, 8); rejects(badLength, 'IHDR 길이 아님');
const zeroWidth = Buffer.from(png); zeroWidth.writeUInt32BE(0, 16); rejects(zeroWidth, '너비0');
const badCrc = Buffer.from(png); badCrc[32] ^= 1; rejects(badCrc, '깨진 IHDR CRC');
for (const length of [2, 3, 5, 7, 10, 15, 21]) rejects(jpegHeader().subarray(0, length), '잘린 JPEG segment ' + length);
rejects(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1]), 'segment 길이1');
rejects(Buffer.from([0xff, 0xd8, 0xff, 0xd9]), 'SOF 없이 EOI');
rejects(Buffer.from([0xff, 0xd8, 0xff, 0xda, 0, 2]), 'SOF 없이 SOS');
rejects(Buffer.from([0xff, 0xd8, 0, 0xc0]), 'marker prefix 없음');
const shortSof = jpegHeader(); shortSof[12] = 8; rejects(shortSof, 'SOF component 길이 불일치');
const zeroHeight = jpegHeader(); zeroHeight[15] = 0; rejects(zeroHeight, '높이0');
rejects(Buffer.from('GIF89a'), '다른 format');
assert.throws(() => rasterDimensions(null), /Buffer/);
console.log('raster-size: 33바이트 PNG IHDR·실제 JPEG 360×2801·표준 SOF13종·잘린/잘못된 헤더 거부 통과');

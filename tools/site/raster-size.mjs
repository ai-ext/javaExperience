const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
const LOSSLESS_SOF = new Set([0xc3, 0xc7, 0xcb, 0xcf]);
const PNG_DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
const invalid = (format, reason) => { throw new Error(`Invalid ${format} header: ${reason}`); };

function ihdrCrc(buffer) {
  let crc = 0xffffffff;
  for (let i = 12; i < 29; i++) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// 크기 헤더만 읽는다. 픽셀 디코딩이나 이미지 파일 전체의 정합성 검사는 하지 않는다.
export function rasterDimensions(buffer) {
  if (!Buffer.isBuffer(buffer)) throw new TypeError('rasterDimensions requires a Buffer');
  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    if (buffer.length < 33) invalid('PNG', 'truncated IHDR');
    if (buffer.readUInt32BE(8) !== 13 || buffer.toString('ascii', 12, 16) !== 'IHDR') invalid('PNG', 'expected first IHDR chunk with length 13');
    const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
    if (!width || !height || width > 0x7fffffff || height > 0x7fffffff) invalid('PNG', 'invalid dimensions');
    if (!PNG_DEPTHS[buffer[25]]?.includes(buffer[24]) || buffer[26] !== 0 || buffer[27] !== 0 || buffer[28] > 1) invalid('PNG', 'invalid IHDR fields');
    if (ihdrCrc(buffer) !== buffer.readUInt32BE(29)) invalid('PNG', 'IHDR CRC mismatch');
    return { format: 'png', width, height };
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset++] !== 0xff) invalid('JPEG', 'expected marker prefix');
      while (offset < buffer.length && buffer[offset] === 0xff) offset++;
      if (offset >= buffer.length) invalid('JPEG', 'truncated marker');
      const marker = buffer[offset++];
      if (marker === 0 || marker === 0xd8) invalid('JPEG', 'invalid marker before SOF');
      if (marker === 0xd9 || marker === 0xda) invalid('JPEG', 'SOF missing before image data/end');
      if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > buffer.length) invalid('JPEG', 'truncated segment length');
      const length = buffer.readUInt16BE(offset), end = offset + length;
      if (length < 2 || end > buffer.length) invalid('JPEG', 'invalid or truncated segment');
      if (JPEG_SOF.has(marker)) {
        if (length < 8) invalid('JPEG', 'truncated SOF');
        const precision = buffer[offset + 2], height = buffer.readUInt16BE(offset + 3), width = buffer.readUInt16BE(offset + 5), components = buffer[offset + 7];
        if (!components || length !== 8 + 3 * components) invalid('JPEG', 'invalid SOF component length');
        const validPrecision = LOSSLESS_SOF.has(marker) ? precision >= 2 && precision <= 16 : (marker === 0xc0 ? precision === 8 : precision === 8 || precision === 12);
        if (!validPrecision || !width || !height) invalid('JPEG', 'invalid or unresolved SOF dimensions/precision');
        return { format: 'jpeg', width, height };
      }
      offset = end;
    }
    invalid('JPEG', 'SOF missing or truncated');
  }
  throw new Error('Unsupported raster format: expected PNG or JPEG header');
}

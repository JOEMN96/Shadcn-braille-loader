import { generateFrames } from './lib/braille-loader';

const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

function formatGridDetailed(str: string, width: number, height: number): string[] {
  const chars = str.split('');
  const lines: string[] = [];

  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      const charCode = chars[col]?.charCodeAt(0) || 0x2800;
      const hasDot = (charCode & DOT_BITS[row][col % 2]) !== 0;
      line += hasDot ? '●' : '○';
    }
    lines.push(line);
  }
  return lines;
}

function compareFrames(frame1: string, frame2: string, width: number, height: number): number {
  let diff = 0;
  const chars1 = frame1.split('');
  const chars2 = frame2.split('');

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const c1 = chars1[col]?.charCodeAt(0) || 0x2800;
      const c2 = chars2[col]?.charCodeAt(0) || 0x2800;

      for (let dc = 0; dc < 2; dc++) {
        const bit1 = (c1 & DOT_BITS[row][dc]) !== 0 ? 1 : 0;
        const bit2 = (c2 & DOT_BITS[row][dc]) !== 0 ? 1 : 0;
        if (bit1 !== bit2) diff++;
      }
    }
  }
  return diff;
}

function debugVariant(variant: string) {
  console.log('\n' + '='.repeat(60));
  console.log('VARIANT: ' + variant);
  console.log('='.repeat(60));

  const { frames, interval } = generateFrames(variant, 4, 4);
  console.log('\nTotal frames: ' + frames.length);
  console.log('Interval: ' + interval + 'ms');

  console.log('\n--- Frame-by-frame comparison ---');
  let totalChanges = 0;
  let maxSingleChange = 0;
  let staticStreak = 0;
  let maxStaticStreak = 0;

  for (let i = 1; i < frames.length; i++) {
    const diff = compareFrames(frames[i-1], frames[i], 4, 4);
    totalChanges += diff;
    maxSingleChange = Math.max(maxSingleChange, diff);

    if (diff === 0) {
      staticStreak++;
      maxStaticStreak = Math.max(maxStaticStreak, staticStreak);
    } else {
      staticStreak = 0;
    }

    if (i <= 5) {
      console.log('\nFrame ' + (i-1) + ' → Frame ' + i + ': ' + diff + ' changed dots');
      if (diff > 0 && diff <= 20) {
        console.log('Frame ' + (i-1) + ':');
        console.log(formatGridDetailed(frames[i-1], 4, 4).join('\n'));
        console.log('\nFrame ' + i + ':');
        console.log(formatGridDetailed(frames[i], 4, 4).join('\n'));
      }
    }
  }

  console.log('\n--- Statistics ---');
  console.log('Total changes across all frames: ' + totalChanges);
  console.log('Average changes per frame: ' + (totalChanges / frames.length).toFixed(2));
  console.log('Max single frame change: ' + maxSingleChange);
  console.log('Longest static streak: ' + maxStaticStreak + ' frames');

  console.log('\n--- Key Frames ---');
  const quarterFrames = [0, Math.floor(frames.length * 0.25), Math.floor(frames.length * 0.5), Math.floor(frames.length * 0.75), frames.length - 1];
  for (const idx of quarterFrames) {
    console.log('\nFrame ' + idx + ':');
    formatGridDetailed(frames[idx], 4, 4).forEach(line => console.log('  ' + line));
  }
}

const variantsToTest = ['breathe', 'pulse', 'snake', 'orbit', 'pendulum', 'compress', 'sort'];

for (const variant of variantsToTest) {
  debugVariant(variant);
}

console.log('\n' + '='.repeat(60));
console.log('COMPLETE');
console.log('='.repeat(60));

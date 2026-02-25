/**
 * Variant Validation Script
 * Generates visual output for all 15 variants side by side
 * to compare against video descriptions
 */

import { generateFrames, resolveGrid } from './lib/braille-loader';

const variantsToValidate = [
  'braille', 'orbit', 'breathe', 'snake', 'fill-sweep',
  'pulse', 'columns', 'checkerboard', 'scan', 'rain',
  'cascade', 'sparkle', 'wave-rows', 'helix', 'diagonal-swipe'
];

function describePattern(frame: string, rows: number, cols: number): {
  dotCount: number;
  patternType: string;
  estimatedCols: number;
} {
  if (!frame) {
    return { dotCount: 0, patternType: 'sparse', estimatedCols: cols };
  }
  
  const lines = frame.split('\n').filter(l => l);
  // Count active braille characters (not the space character)
  const activeDots = lines.join('').split('').filter(c => c !== '\u2800').length;
  
  return {
    dotCount: activeDots,
    patternType: activeDots < 10 ? 'sparse' : activeDots < 20 ? 'medium' : 'dense',
    estimatedCols: Math.max(1, Math.floor(activeDots / rows)) || cols,
  };
}

interface VariantSpec {
  expectedDots: number;
  expectedMotion: string;
  expectedPattern: string;
}

const specs: Record<string, VariantSpec> = {
  'braille': { expectedDots: 2, expectedMotion: 'static', expectedPattern: 'minimal pair' },
  'orbit': { expectedDots: 6, expectedMotion: 'rotational', expectedPattern: 'circular' },
  'breathe': { expectedDots: 6, expectedMotion: 'opacity pulse', expectedPattern: 'stationary ring' },
  'snake': { expectedDots: 9, expectedMotion: 'sequential on/off', expectedPattern: 'moving segment' },
  'fill-sweep': { expectedDots: 7, expectedMotion: 'progressive fill then clear', expectedPattern: 'sweep' },
  'pulse': { expectedDots: 3, expectedMotion: 'brightness expansion', expectedPattern: '2x2 groups' },
  'columns': { expectedDots: 7, expectedMotion: 'vertical sweep', expectedPattern: 'column bars' },
  'checkerboard': { expectedDots: 24, expectedMotion: 'toggling', expectedPattern: 'alternating' },
  'scan': { expectedDots: 20, expectedMotion: 'horizontal scan', expectedPattern: 'vertical bar' },
  'rain': { expectedDots: 9, expectedMotion: 'falling drops', expectedPattern: 'staggered vertical' },
  'cascade': { expectedDots: 8, expectedMotion: 'diagonal stagger', expectedPattern: 'stepped diagonal' },
  'sparkle': { expectedDots: 14, expectedMotion: 'random twinkles', expectedPattern: 'scattered' },
  'wave-rows': { expectedDots: 14, expectedMotion: 'horizontal wave', expectedPattern: 'sine wave' },
  'helix': { expectedDots: 19, expectedMotion: 'spiral path', expectedPattern: 'curved' },
  'diagonal-swipe': { expectedDots: 18, expectedMotion: 'diagonal block', expectedPattern: 'trail' },
};

export function runValidation() {
  console.log('='.repeat(80));
  console.log('BRAILLE LOADER - VARIANT VALIDATION');
  console.log('='.repeat(80));
  
  const [cols, rows] = [4, 4];  // 4x4 test grid (default md size)
  
  for (const variant of variantsToValidate) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`VARIANT: ${variant.toUpperCase()}`);
    console.log('─'.repeat(80));
    
    const spec = specs[variant];
    console.log(`Expected: ~${spec.expectedDots} dots, ${spec.expectedMotion}, ${spec.expectedPattern}`);
    
    const { frames } = generateFrames(variant, cols, rows);
    
    // Sample 8 key frames across animation
    const frameCount = frames.length;
    const sampleIndices = [0, 7, 15, 23, 30, 38, 46, 54].map(f => Math.min(f, frameCount - 1));
    const sampleFrames = sampleIndices.map(f => frames[f]);
    
    console.log('\nSample frames:');
    sampleFrames.forEach((frame, i) => {
      if (!frame) {
        console.log(`\nFrame ${i} (frame ${sampleIndices[i]} of ${frameCount}):`);
        console.log('  ⚠️  Frame is undefined');
        return;
      }
      
      const analysis = describePattern(frame, rows, cols);
      console.log(`\nFrame ${i} (frame ${sampleIndices[i]} of ${frameCount}):`);
      console.log(`  Active dots: ${analysis.dotCount}`);
      console.log(`  Pattern: ${analysis.patternType}`);
      
      // Visual representation (convert braille to ascii)
      const ascii = frame.split('\n').map(line => 
        line.replace(/\u2800/g, '·').replace(/[\u2801-\u28FF]/g, '●')
      ).join('\n');
      console.log(`  Visual:\n${ascii.split('\n').map(l => '    ' + l).join('\n')}`);
    });
    
    // Overall analysis
    console.log('\nMotion analysis:');
    const firstFrame = frames[0];
    const midFrame = frames[Math.floor(frames.length / 2)];
    const lastFrame = frames[frames.length - 1];
    
    const changes1to30 = countFrameChanges(firstFrame, midFrame);
    const changes30to60 = countFrameChanges(midFrame, lastFrame);
    
    console.log(`  Frame 0→${Math.floor(frames.length / 2)} changes: ${changes1to30} dots`);
    console.log(`  Frame ${Math.floor(frames.length / 2)}→60 changes: ${changes30to60} dots`);
    
    if (changes30to60 === 0 && changes1to30 === 0) {
      console.log('  ⚠️  STATIC (no animation detected)');
    } else if (changes30to60 === 0) {
      console.log('  ⚠️  ONE-WAY animation (no reset/clear)');
    } else {
      console.log('  ✓ Animated with reset');
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('VALIDATION COMPLETE');
  console.log('='.repeat(80));
}

function countFrameChanges(frame1: string, frame2: string): number {
  const f1 = frame1.split('');
  const f2 = frame2.split('');
  let changes = 0;
  const maxLen = Math.max(f1.length, f2.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (f1[i] !== f2[i]) changes++;
  }
  
  return changes;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}

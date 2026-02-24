import { generateFrames, resolveGrid } from './lib/braille-loader';

const variants = [
  'pendulum',
  'compress', 
  'sort',
  'breathe',
  'pulse',
  'waveRows',
  'snake',
  'orbit',
  'spiral',
  'rain',
  'sparkle',
  'checkerboard',
  'columns',
  'cascade',
  'diagonalSwipe',
  'scan',
  'fillSweep',
  'helix',
  'braille',
  'interference',
  'gravityWell',
  'phaseShift',
  'reflectedRipple',
];

function brailleToVisual(str: string): string {
  const dotMap: Record<string, string> = {
    ' ': '⬜',
    '⠁': '⠁', '⠂': '⠂', '⠃': '⠃', '⠄': '⠄', '⠅': '⠅',
    '⠆': '⠆', '⠇': '⠇', '⠈': '⠈', '⠉': '⠉', '⠊': '⠊',
    '⠋': '⠋', '⠌': '⠌', '⠍': '⠍', '⠎': '⠎', '⠏': '⠏',
    '⠐': '⠐', '⠑': '⠑', '⠒': '⠒', '⠓': '⠓', '⠔': '⠔',
    '⠕': '⠕', '⠖': '⠖', '⠗': '⠗', '⠘': '⠘', '⠙': '⠙',
    '⠚': '⠚', '⠛': '⠛', '⠜': '⠜', '⠝': '⠝', '⠞': '⠞',
    '⠟': '⠟', '⠠': '⠠', '⠡': '⠡', '⠢': '⠢', '⠣': '⠣',
    '⠤': '⠤', '⠥': '⠥', '⠦': '⠦', '⠧': '⠧', '⠨': '⠨',
    '⠩': '⠩', '⠪': '⠪', '⠫': '⠫', '⠬': '⠬', '⠭': '⠭',
    '⠮': '⠮', '⠯': '⠯', '⠰': '⠰', '⠱': '⠱', '⠲': '⠲',
    '⠳': '⠳', '⠴': '⠴', '⠵': '⠵', '⠶': '⠶', '⠷': '⠷',
    '⠸': '⠸', '⠹': '⠹', '⠺': '⠺', '⠻': '⠻', '⠼': '⠼',
    '⠽': '⠽', '⠾': '⠾', '⠿': '⠿', '⡰': '⡰', '⡀': '⡀',
    '⡁': '⡁', '⡂': '⡂', '⡃': '⡃', '⡄': '⡄', '⡅': '⡅',
    '⡆': '⡆', '⡇': '⡇', '⡈': '⡈', '⡉': '⡉', '⡊': '⡊',
    '⡋': '⡋', '⡌': '⡌', '⡍': '⡍', '⡎': '⡎', '⡏': '⡏',
    '⡐': '⡐', '⡑': '⡑', '⡒': '⡒', '⡓': '⡓', '⡔': '⡔',
    '⡕': '⡕', '⡖': '⡖', '⡗': '⡗', '⡘': '⡘', '⡙': '⡙',
    '⡚': '⡚', '⡛': '⡛', '⡜': '⡜', '⡝': '⡝', '⡞': '⡞',
    '⡟': '⡟', '⡠': '⡠', '⡡': '⡡', '⡢': '⡢', '⡣': '⡣',
    '⡤': '⡤', '⡥': '⡥', '⡦': '⡦', '⡧': '⡧', '⡨': '⡨',
    '⡩': '⡩', '⡪': '⡪', '⡫': '⡫', '⡬': '⡬', '⡭': '⬤',
  };
  
  let result = '';
  for (const char of str) {
    if (char === ' ') {
      result += '⬜';
    } else if (char === '\n') {
      result += '\n';
    } else {
      result += char !== ' ' ? '⬤' : '⬜';
    }
  }
  return result;
}

function formatGrid(str: string, width: number, height: number): string {
  const lines: string[] = [];
  const chars = str.split('');
  
  const DOT_BITS = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80],
  ];
  
  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      const charCode = chars[col]?.charCodeAt(0) || 0x2800;
      const hasDot = (charCode & DOT_BITS[row][col % 2]) !== 0;
      line += hasDot ? '⬤' : '⬜';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

async function debugVariants() {
  const fs = await import('fs');
  
  let output = '=== BRAILLE LOADER DEBUG OUTPUT ===\n\n';
  
  const gridWidth = 4;
  const gridHeight = 4;
  
  for (const variant of variants) {
    output += `========================================\n`;
    output += `VARIANT: ${variant}\n`;
    output += `========================================\n\n`;
    
    try {
      const { frames, interval } = generateFrames(variant, gridWidth, gridHeight);
      
      output += `Total frames: ${frames.length}\n`;
      output += `Interval: ${interval}ms\n\n`;
      
      // Output key frames (start, middle, end)
      const keyFrames = [0, Math.floor(frames.length / 2), frames.length - 1];
      
      for (const frameIdx of keyFrames) {
        output += `--- Frame ${frameIdx} ---\n`;
        output += `Braille: "${frames[frameIdx]}"\n`;
        output += `Visual (grid):\n`;
        output += formatGrid(frames[frameIdx], gridWidth, gridHeight) + '\n\n';
      }
      
      // Output a sequence of frames for animation preview
      output += `--- Animation Sequence (every 5th frame) ---\n`;
      for (let i = 0; i < Math.min(frames.length, 20); i += 5) {
        output += `Frame ${i}: ${formatGrid(frames[i], gridWidth, gridHeight).replace(/\n/g, ' | ')}\n`;
      }
      output += '\n';
      
    } catch (error) {
      output += `ERROR: ${error}\n\n`;
    }
  }
  
  // Write to file
  fs.writeFileSync('debug-output.txt', output);
  console.log('Debug output written to debug-output.txt');
}

debugVariants().catch(console.error);

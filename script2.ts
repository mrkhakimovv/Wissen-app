import fs from 'fs';
import path from 'path';

function walk(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Fix the broken gradient class
  content = content.replace(/col-span-2  from-\[#fec204\] to-\[#fec204\] rounded-2xl p-5 text-white shadow-sm/g, "col-span-2 bg-[#fec204] rounded-2xl p-5 text-black shadow-sm");
  
  // For the icon inside it, text-white should become black or black/80
  content = content.replace(/className="text-white\/80 text-sm font-medium"/g, 'className="text-black/80 text-sm font-medium"');
  content = content.replace(/bg-white\/20 p-3 rounded-full/g, 'bg-black/10 p-3 rounded-full');
  content = content.replace(/className="text-white"/g, 'className="text-black"');
  content = content.replace(/text-white/g, 'text-black');
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Done");

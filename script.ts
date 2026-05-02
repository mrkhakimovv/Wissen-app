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
  content = content.replace(/Ve Sen O'quv Markazi/g, "Wissen O'quv Markazi");
  content = content.replace(/\[#1D9E75\]/g, "[#fec204]");
  content = content.replace(/\[#15805e\]/g, "[#e3a602]");
  content = content.replace(/bg-\[#fec204\] text-white/g, "bg-[#fec204] text-black");
  content = content.replace(/\[#D85A30\]/g, "[#fec204]");
  content = content.replace(/\[#c24b26\]/g, "[#e3a602]");
  content = content.replace(/hover:bg-orange-700/g, "hover:bg-[#e3a602]");
  
  // also fix some gradient issues in AdminDashboard
  content = content.replace(/from-\[#D85A30\]/g, "from-[#fec204]");
  content = content.replace(/to-\[#E97A55\]/g, "to-[#fec204]");
  content = content.replace(/bg-gradient-to-r/g, ""); // Remove gradient if we just want solid yellow
  
  fs.writeFileSync(file, content, 'utf8');
});

console.log("Done");

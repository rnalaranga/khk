const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('h:/ANTIGRAVITY/KHK/frontend/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;

  // Replace single/double quoted localhost strings with backticks using window.location.hostname
  content = content.replace(/(['"])http:\/\/localhost:5000(.*?)\1/g, '`http://${window.location.hostname}:5000$2`');
  
  // Replace any remaining localhost strings (which are already inside backticks)
  content = content.replace(/http:\/\/localhost:5000/g, 'http://${window.location.hostname}:5000');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
  }
});

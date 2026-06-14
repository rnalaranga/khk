const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const target = `.glass-modal {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}`;

const replacement = `.glass-modal {
  background: var(--smoke-bg);
  backdrop-filter: blur(var(--smoke-blur));
  -webkit-backdrop-filter: blur(var(--smoke-blur));
  border: 1px solid var(--glass-border);
  padding: 24px;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}`;

const r1 = target.replace(/\n/g, '\r\n');
if(css.includes(target)) css = css.replace(target, replacement);
else if (css.includes(r1)) css = css.replace(r1, replacement);

fs.writeFileSync('src/index.css', css);
console.log('Done CSS');

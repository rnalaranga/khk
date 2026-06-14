const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const target1 = ".toast-stack { position: fixed; bottom: 32px; right: 32px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }";
const replacement1 = ".toast-stack { position: fixed; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }\n.toast-center { top: 50%; left: 50%; transform: translate(-50%, -50%); align-items: center; justify-content: center; }\n.toast-top-right { top: 80px; right: 24px; }";

const target2 = "animation: toastIn 0.3s var(--ease);\n}\n.toast-success { border-left-color: #22C55E; }\n@keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }";
const replacement2 = "animation: toastIn 0.3s var(--ease);\n}\n.toast-center .toast { font-size: 1.15rem; padding: 24px 36px; border-radius: 12px; }\n.toast-success { border-left-color: #22C55E; }\n@keyframes toastIn { from { opacity: 0; transform: translateY(-20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }";

css = css.replace(target1, replacement1);
css = css.replace(target2, replacement2);
// in case of CRLF
css = css.replace(target2.replace(/\n/g, '\r\n'), replacement2);

fs.writeFileSync('src/index.css', css);
console.log("Done");

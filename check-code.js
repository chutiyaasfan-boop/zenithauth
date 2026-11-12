const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'public', 'js', 'app.js');
let code = fs.readFileSync(targetPath, 'utf8');

console.log('Original public/js/app.js length:', code.length);

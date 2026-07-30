import fs from 'fs';
const txt = fs.readFileSync('src/config/config_product.json', 'utf8');
fs.writeFileSync('src/config/config_product.json', txt.replace(/flase/g, 'false'));

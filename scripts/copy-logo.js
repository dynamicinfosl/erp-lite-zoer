const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\Administrator\\Documents\\Juga sistemas\\6x\\logo SF 2 juga@6x.png";
const dest = path.join(__dirname, '..', 'public', 'logo-juga.png');

try {
  fs.copyFileSync(src, dest);
  console.log('✅ Logo copied successfully to:', dest);
} catch (err) {
  console.error('❌ Error copying logo:', err);
}

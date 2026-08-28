const fs = require('fs');
const path = './api.php';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/WHERE admin_id = \?/g, "WHERE (admin_id = ? OR ? = 'superadmin')");
content = content.replace(/execute\(\[\$tenant_id\]\)/g, "execute([$tenant_id, $tenant_id])");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed queries in api.php.');

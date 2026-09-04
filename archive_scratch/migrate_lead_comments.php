<?php
$pdo = new PDO("sqlite:" . __DIR__ . "/../backend/database.sqlite");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Upgrade leads table with assigned_at, assigned_by, next_action
$cols = [];
$stmt = $pdo->query("PRAGMA table_info(leads)");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $cols[] = $row['name'];
}

if (!in_array('assigned_at', $cols)) {
    $pdo->exec("ALTER TABLE leads ADD COLUMN assigned_at DATETIME DEFAULT NULL");
    echo "Added assigned_at to leads\n";
}
if (!in_array('assigned_by', $cols)) {
    $pdo->exec("ALTER TABLE leads ADD COLUMN assigned_by VARCHAR(100) DEFAULT 'admin'");
    echo "Added assigned_by to leads\n";
}
if (!in_array('next_action', $cols)) {
    $pdo->exec("ALTER TABLE leads ADD COLUMN next_action TEXT DEFAULT ''");
    echo "Added next_action to leads\n";
}

// 2. Create lead_comments table
$pdo->exec("CREATE TABLE IF NOT EXISTS lead_comments (
    id VARCHAR(50) PRIMARY KEY,
    lead_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");
echo "lead_comments table verified.\n";

// 3. Verify users table has a subadmin to test with
$stmt = $pdo->query("SELECT * FROM users WHERE role = 'subadmin'");
$subadmins = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Subadmins found: " . count($subadmins) . "\n";
if (count($subadmins) === 0) {
    $hash = password_hash('admin@2026', PASSWORD_DEFAULT);
    $pdo->exec("INSERT INTO users (id, username, name, email, phone, role, status, password_hash, plain_password, created_at)
                VALUES ('u-sub-1', 'rahul_subadmin', 'Rahul SubAdmin', 'rahul@tripgalileo.com', '+91 9876543210', 'subadmin', 'active', '$hash', 'admin@2026', datetime('now'))");
    echo "Created sample subadmin: rahul_subadmin\n";
}

echo "Database migrations complete!\n";

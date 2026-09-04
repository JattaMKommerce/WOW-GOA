<?php
$filesToDelete = [
    __DIR__ . '/../frontend/src/context/AuthContext.jsx',
    __DIR__ . '/../frontend/src/components/auth/ProtectedRoute.jsx',
    __DIR__ . '/../frontend/src/pages/common/UnauthorizedPage.jsx',
    __DIR__ . '/../frontend/src/pages/common/NotFoundPage.jsx',
    __DIR__ . '/../frontend/src/pages/common/LoginPage.jsx',
    __DIR__ . '/../frontend/src/layouts/CustomerLayout.jsx',
    __DIR__ . '/../frontend/src/layouts/AdminLayout.jsx',
    __DIR__ . '/../frontend/src/layouts/SuperAdminLayout.jsx',
    __DIR__ . '/../frontend/src/components/common/AdminNotificationDropdown.jsx',
    __DIR__ . '/test_rbac_api.php'
];

foreach ($filesToDelete as $file) {
    if (file_exists($file)) {
        unlink($file);
        echo "Deleted: $file\n";
    } else {
        echo "Not found (already removed): $file\n";
    }
}

// Remove empty directories if they are now empty
$dirs = [
    __DIR__ . '/../frontend/src/components/auth',
    __DIR__ . '/../frontend/src/layouts',
    __DIR__ . '/../frontend/src/pages/common'
];

foreach ($dirs as $dir) {
    if (is_dir($dir) && count(scandir($dir)) == 2) {
        rmdir($dir);
        echo "Removed empty dir: $dir\n";
    }
}

echo "Cleanup complete!\n";

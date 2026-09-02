import os
import shutil
import zipfile

base_dir = r"d:\wow goa\Tripgalileo (2)\Tripgalileo"
temp_dir = os.path.join(base_dir, "temp_cpanel_build")
zip_out = os.path.join(base_dir, "cpanel_ready_deploy.zip")

if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
os.makedirs(temp_dir, exist_ok=True)

# 1. Copy dist contents to temp_dir
dist_dir = os.path.join(base_dir, "frontend", "dist")
for item in os.listdir(dist_dir):
    s = os.path.join(dist_dir, item)
    d = os.path.join(temp_dir, item)
    if os.path.isdir(s):
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 2. Copy .htaccess to root
htaccess_src = os.path.join(base_dir, ".htaccess")
if os.path.exists(htaccess_src):
    shutil.copy2(htaccess_src, os.path.join(temp_dir, ".htaccess"))

# 3. Copy backend folder (exclude .sqlite, .zip, .git, test scripts if needed)
backend_src = os.path.join(base_dir, "backend")
backend_dest = os.path.join(temp_dir, "backend")
os.makedirs(backend_dest, exist_ok=True)

excluded_exts = {".sqlite", ".zip", ".log"}
for item in os.listdir(backend_src):
    s = os.path.join(backend_src, item)
    d = os.path.join(backend_dest, item)
    _, ext = os.path.splitext(item)
    if ext in excluded_exts:
        continue
    if os.path.isdir(s):
        if item in {"migrations"}:
            continue
        shutil.copytree(s, d)
    else:
        shutil.copy2(s, d)

# 4. Create ZIP
if os.path.exists(zip_out):
    os.remove(zip_out)

with zipfile.ZipFile(zip_out, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, temp_dir)
            zipf.write(full_path, rel_path)

shutil.rmtree(temp_dir)
print("Successfully created cpanel_ready_deploy.zip!")

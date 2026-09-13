# Create a ZIP archive of the Knight Ads platform.
# Excludes build artifacts, dependencies, and caches to keep the archive portable.
import zipfile, os, sys
from pathlib import Path

SRC = Path("/home/z/my-project")
DST = Path("/home/z/my-project/download/Knight-Ads-Plataforma-v2.4.zip")

# Patterns/dirs to skip (by path prefix relative to project root)
EXCLUDE_DIRS = {
    "node_modules", ".next", ".git", ".turbo", ".cache",
    "tests", "skills", "examples", "upload", "dev.log", "server.log",
    "tool-results", "mini-services",
}
# Also skip the zip itself and any db lock files
EXCLUDE_FILES = {"dev.log", "server.log"}
EXCLUDE_SUFFIX = (".log", ".zip", ".db-journal", ".db-wal", ".db-shm")

def should_skip(rel_path: str) -> bool:
    parts = rel_path.split(os.sep)
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    if os.path.basename(rel_path) in EXCLUDE_FILES:
        return True
    if rel_path.endswith(EXCLUDE_SUFFIX):
        return True
    # Skip the db file itself (it will be recreated by db:push + db:seed)
    if rel_path == "db/custom.db":
        return True
    # Skip the generated scripts dir? No — include scripts/ (process-logo, gen-docs, fix-logo-alpha)
    # but skip __pycache__
    if "__pycache__" in parts:
        return True
    return False

count = 0
total_bytes = 0

with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for root, dirs, files in os.walk(SRC):
        # Prune excluded dirs in-place (stops os.walk from descending)
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
        for fn in files:
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, SRC)
            if should_skip(rel):
                continue
            # Skip files > 5 MB (like the original uploaded image)
            try:
                size = os.path.getsize(full)
            except OSError:
                continue
            if size > 5_000_000:
                continue
            arcname = os.path.join("knight-ads", rel)
            zf.write(full, arcname)
            count += 1
            total_bytes += size

zip_size = DST.stat().st_size
print(f"✓ ZIP created: {DST}")
print(f"  Files: {count}")
print(f"  Uncompressed: {total_bytes / 1024:.1f} KB")
print(f"  Compressed:   {zip_size / 1024:.1f} KB")
print(f"  Ratio: {(1 - zip_size/total_bytes)*100:.1f}% reduction" if total_bytes else "N/A")

import os
import re

def get_relative_prefix(file_path, base_dir):
    rel_path = os.path.relpath(file_path, base_dir)
    depth = rel_path.count(os.sep)
    if depth == 0:
        return "./"
    else:
        return "../" * depth

def fix_paths_in_html(file_path, base_dir):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    prefix = get_relative_prefix(file_path, base_dir)

    # Replace href="/" with href="./" or href="../../"
    content = re.sub(r'href="/"', f'href="{prefix}"', content)
    
    # Replace href="/something" with href="prefixsomething"
    content = re.sub(r'href="/([^/][^"]*)"', rf'href="{prefix}\1"', content)
    
    # Replace src="/something" with src="prefixsomething"
    content = re.sub(r'src="/([^/][^"]*)"', rf'src="{prefix}\1"', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"d:\Projects\FreeToolKit\toolkit-website"
for root, _, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.html'):
            fix_paths_in_html(os.path.join(root, file), base_dir)

print("HTML paths updated successfully!")

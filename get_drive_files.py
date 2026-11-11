import re
import json

with open('drive_folder.html', 'r', encoding='utf-8') as f:
    text = f.read()

# In Google Drive HTML:
# JSON array often looks like: [...,"FILE_ID",[...,"FILENAME.png",...],...]
# Let's find all [\"(ID)\",[\"(NAME)\"
pattern = r'\[\"([a-zA-Z0-9_-]{33})\",\[\"(.*?)\"'
found = re.findall(pattern, text)
print('Exact matches:')
items = {}
for file_id, name in found:
    if name.endswith('.png') or name.endswith('.jpg'):
        items[file_id] = name
        print(f'{file_id} : {name}')

with open('drive_files.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2, ensure_ascii=False)
print('Saved', len(items), 'files to drive_files.json')

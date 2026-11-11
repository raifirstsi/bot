with open('drive_folder.html', 'r', encoding='utf-8') as f:
    text = f.read()

filenames = [
    'Capiwara bông suy tư cùng tai nghe RAI².png',
    'Capybara bông hồng đeo tai nghe.png',
    'Capybara dễ thương làm việc cùng laptop.png',
    'Capybara RAI² hạnh phúc trong phòng thu.png',
    'Capybara vui vẻ dùng laptop RAI².png',
    'Chuột lang nước bông đeo tai nghe.png',
    'Gấu bông Capybara đeo tai nghe RAI².png',
    'Thú bông Capybara với máy tính bảng phát sáng.png'
]

import re
import json

file_map = {}
for fn in filenames:
    idx = text.find(fn)
    if idx != -1:
        snippet = text[max(0, idx - 400):idx + 200]
        # find 33-char drive IDs in snippet
        ids = re.findall(r'[a-zA-Z0-9_-]{33}', snippet)
        print(f'File: {fn}')
        print(f'  Found candidate IDs: {ids}')
        if ids:
            file_map[fn] = ids[0]

with open('capybara_files.json', 'w', encoding='utf-8') as f:
    json.dump(file_map, f, indent=2, ensure_ascii=False)

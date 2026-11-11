import re
import json

with open('drive_folder.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Google Drive folder page encodes files in javascript objects. Let's find patterns like [id, name, mimeType...]
# Match 33-char drive IDs and image filenames
files = []
# Match pattern: ["FILE_ID", ... "filename.png"]
matches = re.findall(r'\[\"([a-zA-Z0-9_-]{28,35})\"[,\s]+\[\"(.*?)\"', text)
print('Direct matches:', len(matches))
for m in matches:
    print(m)

# Also let's search for .png, .jpg, .svg, .webp in text
img_names = re.findall(r'([a-zA-Z0-9_ -]+\.(?:png|jpg|jpeg|svg|webp))', text, re.IGNORECASE)
print('Image filenames found:', set(img_names))

# Also search for drive file IDs
# In Google Drive client state: ["id",["name",...]]
blocks = re.findall(r'\[\"([a-zA-Z0-9_-]{33})\",\[\"([^\"]+)\"', text)
print('33-char blocks:', blocks)

# Extract any JSON-like structures containing file data
for m in re.finditer(r'\"([a-zA-Z0-9_-]{33})\".*?\"([^\"]+\.(?:png|jpg|webp))\"', text):
    print('Regex match:', m.groups())

import urllib.request
import re
import json

url = 'https://drive.google.com/drive/folders/1uPLn6N8YPAu5QaynybEjwjHDoFoICvy1'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        with open('drive_folder.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print('Saved drive_folder.html, size:', len(html))
except Exception as e:
    print('Error:', e)

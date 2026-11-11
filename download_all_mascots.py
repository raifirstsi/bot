import urllib.request
import json
import os
from PIL import Image, ImageDraw

files = {
  "mascot-1": ("1u8SPGbT0ksecdV2fuRHaRHpcP__bwATF", "Capybara dễ thương làm việc cùng laptop"),
  "mascot-2": ("1G0NxfFogzHrveUqEqd1UZcYIm0wjM6rG", "Capybara vui vẻ dùng laptop RAI²"),
  "mascot-3": ("1In5MB5xibp4YkNeqEEJ2KP8rWIcgqPDj", "Capiwara bông suy tư cùng tai nghe RAI²"),
  "mascot-4": ("1S6XIelUwfYFpPY1yKu2fnaKWYo4GIuvz", "Capybara bông hồng đeo tai nghe"),
  "mascot-5": ("1gErL_2ZDqDoKN_WZe98e2bsM-T9QxrWe", "Capybara RAI² hạnh phúc trong phòng thu"),
  "mascot-6": ("1Z1HA6FY5M8ZK8ytvULVc9COADqSM0EQt", "Chuột lang nước bông đeo tai nghe"),
  "mascot-7": ("1uQEL45TWjJSC1JiFMqLqZOLwuqDEiMPC", "Gấu bông Capybara đeo tai nghe RAI²"),
  "mascot-8": ("1LjlrI-AS1tld8KOuQeXQKnunbeK8zvdM", "Thú bông Capybara với máy tính bảng phát sáng"),
}

os.makedirs("public/assets/mascots", exist_ok=True)
os.makedirs("dist/assets/mascots", exist_ok=True)

manifest = []

def make_circle(im_path, out_path, size=320):
    try:
        im = Image.open(im_path).convert("RGBA")
        # center crop to square if not square
        w, h = im.size
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        cropped = im.crop((left, top, left + min_dim, top + min_dim))
        resized = cropped.resize((size, size), Image.Resampling.LANCZOS)
        
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size - 1, size - 1), fill=255)
        resized.putalpha(mask)
        resized.save(out_path, format="PNG", optimize=True)
        return True
    except Exception as e:
        print(f"Error making circle for {im_path}: {e}")
        return False

for key, (file_id, name) in files.items():
    raw_path = f"public/assets/mascots/{key}-raw.png"
    circle_path = f"public/assets/mascots/{key}.png"
    dist_circle_path = f"dist/assets/mascots/{key}.png"

    print(f"Downloading {key}: {name} (ID: {file_id})...")
    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&authuser=0&confirm=t"
    cmd = f'curl.exe -s -L "{url}" -o "{raw_path}"'
    os.system(cmd)

    if os.path.exists(raw_path) and os.path.getsize(raw_path) > 1000:
        make_circle(raw_path, circle_path, size=320)
        make_circle(raw_path, dist_circle_path, size=320)
        manifest.append({
            "id": key,
            "name": name,
            "url": f"/assets/mascots/{key}.png"
        })
        print(f"Successfully processed {key}")
    else:
        print(f"Failed to download {key}")

with open("public/assets/mascots/manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print("Done! Total mascots downloaded and processed:", len(manifest))

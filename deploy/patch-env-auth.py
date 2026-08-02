from pathlib import Path

env_path = Path("/opt/labelmaker-pro/.env")
text = env_path.read_text(encoding="utf-8") if env_path.exists() else ""

updates = {
    "AUTH_EMAIL": "cas@ebbersevent.technology",
    "AUTH_PASSWORD": "IkbenCas123#",
    "AUTH_SECRET": "d10e0eb72c50bb98d22832b7c53642c594e81a6fe704af95fc2efe8fbf1ed37f",
    "COOKIE_SECURE": "auto",
}

lines = []
seen = set()
for line in text.splitlines():
    if not line.strip() or line.lstrip().startswith("#") or "=" not in line:
        lines.append(line)
        continue
    key = line.split("=", 1)[0].strip()
    if key in updates:
        lines.append(f"{key}={updates[key]}")
        seen.add(key)
    else:
        lines.append(line)

for key, val in updates.items():
    if key not in seen:
        lines.append(f"{key}={val}")

env_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
print("env_patched", sorted(updates))

import http.cookiejar
import json
import urllib.request

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

# Unauthenticated state should 401
try:
    opener.open("http://127.0.0.1:3000/api/state")
    print("state_without_login FAIL (expected 401)")
except urllib.error.HTTPError as e:
    print("state_without_login", e.code)

# Login
req = urllib.request.Request(
    "http://127.0.0.1:3000/api/auth/login",
    data=json.dumps(
        {"email": "cas@ebbersevent.technology", "password": "IkbenCas123#"}
    ).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
with opener.open(req) as r:
    print("login", r.status, json.load(r))
    print("set-cookie", r.headers.get("Set-Cookie"))
print("cookies", [(c.name, c.value[:16] + "…", c.secure) for c in cj])

with opener.open("http://127.0.0.1:3000/api/auth/me") as r:
    print("me", json.load(r))

with opener.open("http://127.0.0.1:3000/api/state") as r:
    d = json.load(r)
    print("state_ok presets", len(d["presets"]))

# Bad password
bad = urllib.request.Request(
    "http://127.0.0.1:3000/api/auth/login",
    data=json.dumps({"email": "cas@ebbersevent.technology", "password": "wrong"}).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
try:
    opener.open(bad)
    print("bad_login FAIL")
except urllib.error.HTTPError as e:
    print("bad_login", e.code)

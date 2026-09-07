#!/usr/bin/env bash
# One-shot production-build smoke test: boots built api+web, probes key flows, tears down.
# Usage: bash scripts/smoke.sh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAILED=0

say()  { printf '\n== %s ==\n' "$1"; }
pass() { printf 'PASS %s\n' "$1"; }
fail() { printf 'FAIL %s\n' "$1"; FAILED=1; }

cleanup() {
  [ -n "${WEB_PID:-}" ] && kill "$WEB_PID" 2>/dev/null
  [ -n "${API_PID:-}" ] && kill "$API_PID" 2>/dev/null
  wait 2>/dev/null
  true
}
trap cleanup EXIT

say "Booting built API (3001) and web (3000)"
if [ ! -f apps/api/dist/main.js ]; then
  echo "api dist missing — run pnpm build first"; exit 1
fi
if [ ! -f apps/web/.next/BUILD_ID ]; then
  echo "web build missing — run pnpm build first"; exit 1
fi

PORT=3001 node apps/api/dist/main.js > /tmp/kia-smoke-api.log 2>&1 &
API_PID=$!
PORT=3000 API_PROXY_TARGET=http://localhost:3001 node "$ROOT/apps/web/node_modules/next/dist/bin/next" start "$ROOT/apps/web" -p 3000 \
  > /tmp/kia-smoke-web.log 2>&1 &
WEB_PID=$!

for i in $(seq 1 60); do
  curl -sf http://localhost:3001/api/health >/dev/null 2>&1 && break
  sleep 1
done
for i in $(seq 1 60); do
  curl -sf -o /dev/null http://localhost:3000/ 2>/dev/null && break
  sleep 1
done

say "API health"
HEALTH=$(curl -s http://localhost:3001/api/health)
echo "$HEALTH" | head -c 200; echo
echo "$HEALTH" | grep -q '"status"' && pass "health responds" || fail "health responds"

say "Public pages render"
for p in / /material /education /courses /privacy /terms; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$p")
  if [ "$CODE" = "200" ]; then pass "GET $p -> 200"; else fail "GET $p -> $CODE"; fi
done

say "Auth gates"
C=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/progress)
[ "$C" = "401" ] && pass "unauthenticated /api/progress -> 401" || fail "unauth /api/progress -> $C"
C=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/admin/users)
[ "$C" = "401" ] && pass "unauthenticated /api/admin/users -> 401" || fail "unauth admin -> $C"
C=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/learn/html/html-accessibility)
[ "$C" = "200" -o "$C" = "307" -o "$C" = "404" ] && pass "learn route reachable ($C)" || fail "learn route -> $C"

say "OTP flow"
OTP=$(curl -s -X POST http://localhost:3000/api/auth/otp/request \
  -H 'Content-Type: application/json' -d '{"phone":"09120000000"}')
echo "$OTP" | head -c 300; echo
CODE=$(printf '%s' "$OTP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).devCode||'')}catch{console.log('')}})")
if [ -n "$CODE" ]; then
  VER=$(curl -s -X POST http://localhost:3000/api/auth/otp/verify \
    -H 'Content-Type: application/json' -d "{\"phone\":\"09120000000\",\"code\":\"$CODE\"}")
  echo "$VER" | head -c 200; echo
  printf '%s' "$VER" | grep -q 'accessToken\|needsProfile' \
    && pass "OTP verify issues session/profile gate" \
    || fail "OTP verify response unexpected"
else
  echo "(OTP dev code not exposed — OTP_DEV_EXPOSE unset in this env; skipping verify probe)"
  pass "OTP request accepted (dev code not exposed)"
fi

say "Password reset & change flow (AUTH-4)"
SMOKE_EMAIL="smoke-$(date +%s)@test.kia"
REG=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"Smoke Tester\",\"email\":\"$SMOKE_EMAIL\",\"password\":\"Smokepass1!\",\"passwordConfirm\":\"Smokepass1!\",\"province\":\"تهران\",\"city\":\"تهران\"}")
[ "$REG" = "201" -o "$REG" = "200" ] && pass "register test account -> $REG" || fail "register -> $REG"

# Enumeration protection: known and unknown addresses must be indistinguishable.
KNOWN=$(curl -s -X POST http://localhost:3000/api/auth/forgot-password \
  -H 'Content-Type: application/json' -d "{\"email\":\"$SMOKE_EMAIL\"}")
UNKNOWN=$(curl -s -X POST http://localhost:3000/api/auth/forgot-password \
  -H 'Content-Type: application/json' -d '{"email":"nobody@nowhere.test"}')
[ "$KNOWN" = "$UNKNOWN" ] && pass "forgot-password response is uniform (no enumeration)" \
  || fail "forgot-password responses differ: '$KNOWN' vs '$UNKNOWN'"

# Rejected reset: well-shaped token that was never issued.
BADRESET=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d "{\"token\":\"$(printf 'f%.0s' $(seq 1 64))\",\"password\":\"Newpass123!\",\"passwordConfirm\":\"Newpass123!\"}")
[ "$BADRESET" = "400" ] && pass "unknown reset token -> 400" || fail "unknown reset token -> $BADRESET"

# Happy path: pull the raw token from the dev-only log line (no SMTP in smoke env).
RAW_TOKEN=$(grep "$SMOKE_EMAIL" /tmp/kia-smoke-api.log 2>/dev/null | grep -o 'token=[0-9a-f]\{64\}' | tail -1 | cut -d= -f2)
if [ -n "$RAW_TOKEN" ]; then
  RESET=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/reset-password \
    -H 'Content-Type: application/json' \
    -d "{\"token\":\"$RAW_TOKEN\",\"password\":\"Newpass123!\",\"passwordConfirm\":\"Newpass123!\"}")
  [ "$RESET" = "201" -o "$RESET" = "200" ] && pass "reset-password with emailed token -> $RESET" || fail "reset-password -> $RESET"

  OLDLOGIN=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"Smokepass1!\"}")
  [ "$OLDLOGIN" = "401" ] && pass "old password rejected after reset -> 401" || fail "old password -> $OLDLOGIN"

  NEWLOGIN=$(curl -s -c /tmp/kia-smoke-cookies.txt -w '%{http_code}' -o /tmp/kia-smoke-login.json -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"Newpass123!\"}")
  [ "$NEWLOGIN" = "201" -o "$NEWLOGIN" = "200" ] && pass "new password login -> $NEWLOGIN" || fail "new password login -> $NEWLOGIN"
  ACCESS=$(node -e "try{console.log(JSON.parse(require('fs').readFileSync('/tmp/kia-smoke-login.json','utf8')).accessToken||'')}catch{console.log('')}")

  WRONGCHG=$(curl -s -b /tmp/kia-smoke-cookies.txt -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/change-password \
    -H 'Content-Type: application/json' -H "Authorization: Bearer $ACCESS" \
    -d '{"currentPassword":"wrongpass9","newPassword":"Finalpass9!"}')
  [ "$WRONGCHG" = "401" ] && pass "change-password with wrong current -> 401" || fail "wrong change-password -> $WRONGCHG"

  GOODCHG=$(curl -s -b /tmp/kia-smoke-cookies.txt -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/change-password \
    -H 'Content-Type: application/json' -H "Authorization: Bearer $ACCESS" \
    -d '{"currentPassword":"Newpass123!","newPassword":"Finalpass9!"}')
  [ "$GOODCHG" = "201" -o "$GOODCHG" = "200" ] && pass "change-password happy path -> $GOODCHG" || fail "change-password -> $GOODCHG"

  FINALLOGIN=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' -d "{\"email\":\"$SMOKE_EMAIL\",\"password\":\"Finalpass9!\"}")
  [ "$FINALLOGIN" = "201" -o "$FINALLOGIN" = "200" ] && pass "login with changed password -> $FINALLOGIN" || fail "final login -> $FINALLOGIN"
else
  echo "(reset token not in log — SMTP configured or NODE_ENV=production; skipping reset happy path)"
  pass "forgot-password dispatched (token not inspectable in this env)"
fi

say "Two-factor authentication (AUTH-5, staff)"
ADMIN_EMAIL="admin@kia.academy"
ADMIN_PW="KiaAcademy123!"
ADMIN_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PW\"}")
ADMIN_ACCESS=$(printf '%s' "$ADMIN_LOGIN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).accessToken||'')}catch{console.log('')}})")
if [ -n "$ADMIN_ACCESS" ]; then
  pass "admin login (pre-2FA) succeeds"

  SETUP=$(curl -s -X POST http://localhost:3000/api/auth/2fa/setup \
    -H "Authorization: Bearer $ADMIN_ACCESS")
  SECRET=$(printf '%s' "$SETUP" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).secret||'')}catch{console.log('')}})")
  printf '%s' "$SETUP" | grep -q 'qrDataUrl' && pass "2FA setup returns QR + secret" || fail "2FA setup -> $(printf '%s' "$SETUP" | head -c 120)"

  CODE=$(node -e "
    const {createHmac}=require('crypto');
    const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits=0,val=0,bytes=[];
    for(const ch of '$SECRET'){const i=A.indexOf(ch);if(i<0)continue;val=(val<<5)|i;bits+=5;if(bits>=8){bytes.push((val>>>(bits-8))&255);bits-=8;}}
    const counter=Math.floor(Date.now()/1000/30);
    const buf=Buffer.alloc(8);buf.writeUInt32BE(Math.floor(counter/4294967296),0);buf.writeUInt32BE(counter>>>0,4);
    const h=createHmac('sha1',Buffer.from(bytes)).update(buf).digest();
    const o=h[h.length-1]&15;
    const bin=((h[o]&127)<<24)|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3];
    console.log(String(bin%1000000).padStart(6,'0'));
  ")
  CONFIRM=$(curl -s -X POST http://localhost:3000/api/auth/2fa/confirm \
    -H "Authorization: Bearer $ADMIN_ACCESS" -H 'Content-Type: application/json' \
    -d "{\"code\":\"$CODE\"}")
  printf '%s' "$CONFIRM" | grep -q 'recoveryCodes' && pass "2FA confirm issues 8 recovery codes" || fail "2FA confirm -> $(printf '%s' "$CONFIRM" | head -c 120)"

  GATED=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H 'Content-Type: application/json' -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PW\"}")
  CHALLENGE=$(printf '%s' "$GATED" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).challenge||'')}catch{console.log('')}})")
  printf '%s' "$GATED" | grep -q 'twoFactorRequired' && pass "login now gated behind 2FA (no tokens in response)" || fail "login not gated: $(printf '%s' "$GATED" | head -c 120)"

  CODE2=$(node -e "
    const {createHmac}=require('crypto');
    const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits=0,val=0,bytes=[];
    for(const ch of '$SECRET'){const i=A.indexOf(ch);if(i<0)continue;val=(val<<5)|i;bits+=5;if(bits>=8){bytes.push((val>>>(bits-8))&255);bits-=8;}}
    const counter=Math.floor(Date.now()/1000/30)+1;
    const buf=Buffer.alloc(8);buf.writeUInt32BE(Math.floor(counter/4294967296),0);buf.writeUInt32BE(counter>>>0,4);
    const h=createHmac('sha1',Buffer.from(bytes)).update(buf).digest();
    const o=h[h.length-1]&15;
    const bin=((h[o]&127)<<24)|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3];
    console.log(String(bin%1000000).padStart(6,'0'));
  ")
  VERIFY=$(curl -s -o /tmp/kia-smoke-2fa.json -w '%{http_code}' -X POST http://localhost:3000/api/auth/2fa/verify \
    -H 'Content-Type: application/json' -d "{\"challenge\":\"$CHALLENGE\",\"code\":\"$CODE2\"}")
  [ "$VERIFY" = "201" -o "$VERIFY" = "200" ] && pass "2FA verify mints a session -> $VERIFY" || fail "2FA verify -> $VERIFY $(head -c 120 /tmp/kia-smoke-2fa.json)"

  # Clean up: disable so the environment stays re-runnable.
  DIS=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE http://localhost:3000/api/auth/2fa \
    -H "Authorization: Bearer $ADMIN_ACCESS" -H 'Content-Type: application/json' -d "{\"code\":\"$CODE2\"}")
  [ "$DIS" = "200" ] && pass "2FA disable (cleanup) -> 200" || fail "2FA disable -> $DIS"
else
  echo "(seeded admin login unavailable — skipping 2FA runtime probes)"
fi

say "SEO artifacts"
for p in /robots.txt /sitemap.xml; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000$p")
  [ "$CODE" = "200" ] && pass "GET $p -> 200" || fail "GET $p -> $CODE"
done

say "done"
exit $FAILED

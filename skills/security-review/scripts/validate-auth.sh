#!/usr/bin/env bash
# validate-auth.sh - Scan generated code for common auth mistakes
# Zero token cost: executed, not loaded as context
# Usage: bash validate-auth.sh [file-or-directory]

set -euo pipefail

TARGET="${1:-.}"
FOUND=0

red() { printf '\033[0;31m%s\033[0m\n' "$1"; }
green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
dim() { printf '\033[0;90m%s\033[0m\n' "$1"; }

echo "Auth security scan: $TARGET"

# 1. Plaintext password storage
hits=$(grep -rn 'password.*=.*["\x27]' "$TARGET" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" \
  | grep -Ev '(\.test\.|\.spec\.|mock|fixture|example|hash|bcrypt|argon|scrypt|pbkdf)' || true)
if [ -n "$hits" ]; then
  red "WARN: Possible plaintext password assignment:"
  echo "$hits" | head -5 | while IFS= read -r line; do dim "  $line"; done
  FOUND=$((FOUND + 1))
fi

# 2. Weak hashing (md5, sha1 for passwords)
hits=$(grep -rn 'md5\|sha1' "$TARGET" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" \
  | grep -Ei '(password|secret|token|hash)' \
  | grep -Ev '(\.test\.|\.spec\.|checksum|integrity|etag)' || true)
if [ -n "$hits" ]; then
  red "WARN: Weak hash used for sensitive data:"
  echo "$hits" | head -5 | while IFS= read -r line; do dim "  $line"; done
  FOUND=$((FOUND + 1))
fi

# 3. JWT in localStorage
hits=$(grep -rn 'localStorage.*\(token\|jwt\|auth\)' "$TARGET" --include="*.ts" --include="*.js" --include="*.tsx" --include="*.jsx" || true)
if [ -n "$hits" ]; then
  red "WARN: JWT/token stored in localStorage (XSS vulnerable):"
  echo "$hits" | head -5 | while IFS= read -r line; do dim "  $line"; done
  FOUND=$((FOUND + 1))
fi

# 4. Hardcoded secrets
hits=$(grep -rn 'secret.*=.*["\x27][a-zA-Z0-9]\{16,\}["\x27]' "$TARGET" --include="*.ts" --include="*.js" --include="*.py" --include="*.go" \
  | grep -Ev '(\.test\.|\.spec\.|\.example|placeholder|CHANGE_ME)' || true)
if [ -n "$hits" ]; then
  red "WARN: Possible hardcoded secret:"
  echo "$hits" | head -5 | while IFS= read -r line; do dim "  $line"; done
  FOUND=$((FOUND + 1))
fi

if [ "$FOUND" -eq 0 ]; then
  green "OK: No common auth mistakes detected"
else
  red "Found $FOUND potential auth issue(s). Review above."
fi

exit $FOUND

# macOS/Linux의 DNS 질의
dig +noall +answer example.com A
dig +noall +answer example.com AAAA
nslookup example.com

# macOS/Linux에서 TCP 8080 LISTEN 확인
lsof -nP -iTCP:8080 -sTCP:LISTEN

# Linux 대안
ss -lntp '( sport = :8080 )'

# OpenSSL 1.1.1+에서 SNI와 hostname 검증
openssl s_client -connect example.com:443 -servername example.com \
  -verify_hostname example.com -verify_return_error </dev/null

byte[] bytes = new byte[32];
secureRandom.nextBytes(bytes);
String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
byte[] digest = MessageDigest.getInstance("SHA-256")
        .digest(rawToken.getBytes(StandardCharsets.US_ASCII));
resetStore.replacePrevious(memberId, digest, clock.instant().plus(Duration.ofMinutes(15)));
mailer.sendResetLink(verifiedAddress, rawToken); // rawToken은 URL 조립 직후 폐기, 로그 금지

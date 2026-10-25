public class RequestDemo {
    public static void main(String[] args) {
        System.out.println(new SignupRequest(" user@example.com ", "Mina"));
        try { new SignupRequest("bad", "Mina"); }
        catch (IllegalArgumentException e) { System.out.println(e.getMessage()); }
    }
}
record SignupRequest(String email, String displayName) {
    SignupRequest {
        email = email == null ? "" : email.trim();
        displayName = displayName == null ? "" : displayName.trim();
        if (!email.contains("@")) throw new IllegalArgumentException("email is invalid");
        if (displayName.isBlank()) throw new IllegalArgumentException("displayName is required");
    }
}

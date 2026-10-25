package example.demo;

import tools.jackson.databind.json.JsonMapper;

public class MapperExample {
    record Profile(String name, int age) {}

    public static void main(String[] args) throws Exception {
        JsonMapper mapper = JsonMapper.builder().build();
        String json = mapper.writeValueAsString(new Profile("Kim", 29));
        Profile profile = mapper.readValue(json, Profile.class);
        System.out.println(json);
        System.out.println(profile.name() + ":" + profile.age());
    }
}

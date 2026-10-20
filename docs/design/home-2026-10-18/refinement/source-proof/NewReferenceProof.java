import org.example.start.Greeting;
import java.util.Collections;
import java.util.IdentityHashMap;
public class NewReferenceProof {
  public static void main(String[] args) {
    var objects = Collections.newSetFromMap(new IdentityHashMap<Greeting, Boolean>());
    Greeting greeting;
    assert objects.size() == 0;
    greeting = new Greeting("김자바", "김자바님, 반가워요", 3);
    objects.add(greeting);
    assert objects.size() == 1;
    Greeting same = greeting;
    objects.add(same);
    assert same == greeting;
    assert objects.size() == 1;
    Greeting another = new Greeting("김자바", "김자바님, 반가워요", 3);
    objects.add(another);
    assert another != greeting;
    assert another.equals(greeting);
    assert objects.size() == 2;
    assert greeting.name().equals("김자바");
    assert greeting.message().equals("김자바님, 반가워요");
    assert greeting.nameLength() == 3;
    System.out.println("same == greeting: " + (same == greeting));
    System.out.println("another == greeting: " + (another == greeting));
    System.out.println("another.equals(greeting): " + another.equals(greeting));
    System.out.println("distinct recorded Greeting objects: " + objects.size());
    System.out.println(greeting);
  }
}

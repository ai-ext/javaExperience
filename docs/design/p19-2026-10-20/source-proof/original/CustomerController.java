package com.example.p19;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/customers")
public class CustomerController {
    private final CustomerRepository repository;
    public CustomerController(CustomerRepository repository) { this.repository = repository; }

    @PostMapping
    public Customer create(@RequestBody CreateCustomer request) {
        return repository.save(new Customer(request.displayName()));
    }

    @GetMapping
    public List<Customer> findAll() { return repository.findAll(); }

    public record CreateCustomer(String displayName) {}
}

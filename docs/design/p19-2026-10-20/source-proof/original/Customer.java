package com.example.p19;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String displayName;

    protected Customer() {}
    public Customer(String displayName) { this.displayName = displayName; }
    public Long getId() { return id; }
    public String getDisplayName() { return displayName; }
}

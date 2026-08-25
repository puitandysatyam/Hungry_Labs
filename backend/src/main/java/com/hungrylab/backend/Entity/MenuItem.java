package com.hungrylab.backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "menu_item") // Changed case for PostGres safely
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String category;
    private String name;
    
    // "desc" is a reserved keyword in SQL (short for DESCENDING)
    @Column(name = "description") 
    private String desc;
    
    private double price;
    private boolean Veg;
    private String imageUrl;

    @ManyToMany
    @JoinTable(
            name = "menu_items_addons",
            joinColumns = @JoinColumn(name = "menu_item_id"),
            inverseJoinColumns = @JoinColumn(name = "addon_id")
    )
    private List<Addon> addonList;
}

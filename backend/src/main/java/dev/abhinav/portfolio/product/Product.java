package dev.abhinav.portfolio.product;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="products")
public class Product {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=120) private String name;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal price;
    @Column(name="in_stock",nullable=false) private boolean inStock;
    protected Product() {}
    Product(String name, BigDecimal price) { this.name=name; this.price=price; this.inStock=true; }
    public Long getId(){return id;}
    public String getName(){return name;}
    public BigDecimal getPrice(){return price;}
    public boolean isInStock(){return inStock;}
}

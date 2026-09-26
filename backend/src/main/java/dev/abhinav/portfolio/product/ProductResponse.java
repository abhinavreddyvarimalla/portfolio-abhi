package dev.abhinav.portfolio.product;
import java.math.BigDecimal;
public record ProductResponse(Long id,String name,BigDecimal price,boolean inStock,boolean persisted) {
    static ProductResponse from(Product p){return new ProductResponse(p.getId(),p.getName(),p.getPrice(),p.isInStock(),true);}
}

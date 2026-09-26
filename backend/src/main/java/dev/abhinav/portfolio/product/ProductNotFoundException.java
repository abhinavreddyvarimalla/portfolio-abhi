package dev.abhinav.portfolio.product;
public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(long id){super("Product "+id+" was not found");}
}

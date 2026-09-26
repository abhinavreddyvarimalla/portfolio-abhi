package dev.abhinav.portfolio.product;
import java.math.BigDecimal;
import jakarta.validation.constraints.*;
public record ProductRequest(
    @NotBlank @Size(max=120) String name,
    @NotNull @DecimalMin(value="0.00",inclusive=false) @Digits(integer=10,fraction=2) BigDecimal price
) {}

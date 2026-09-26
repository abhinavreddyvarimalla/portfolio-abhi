package dev.abhinav.portfolio.product;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.net.URI;
@RestController @RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    public ProductController(ProductService service){this.service=service;}
    @GetMapping public ProductService.ProductPage list(
        @RequestParam(defaultValue="") @Size(max=120) String name,
        @RequestParam(defaultValue="0") @Min(0) int page,
        @RequestParam(defaultValue="20") @Min(1) @Max(100) int size
    ){return service.list(name,page,size);}
    @GetMapping("/{id}") public ProductResponse find(@PathVariable @Min(1) long id){return service.find(id);}
    @PostMapping public ResponseEntity<ProductResponse> create(@Valid @RequestBody ProductRequest body){
        var result=service.create(body);
        return ResponseEntity.created(URI.create("/api/products/"+result.id())).body(result);
    }
}

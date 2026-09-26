package dev.abhinav.portfolio.product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import java.util.List;
@Service @Transactional(readOnly=true)
public class ProductService {
    private final ProductRepository repository;
    public ProductService(ProductRepository repository){this.repository=repository;}
    public record ProductPage(List<ProductResponse> items,int page,int size,long totalElements,int totalPages){}
    public ProductPage list(String name,int page,int size){
        var result=repository.findByNameContainingIgnoreCase(name.strip(),PageRequest.of(page,size,Sort.by("id")));
        return new ProductPage(result.map(ProductResponse::from).getContent(),page,size,result.getTotalElements(),result.getTotalPages());
    }
    public ProductResponse find(long id){return ProductResponse.from(repository.findById(id).orElseThrow(()->new ProductNotFoundException(id)));}
    @Transactional
    public ProductResponse create(ProductRequest request){
        return ProductResponse.from(repository.saveAndFlush(new Product(request.name().strip(),request.price())));
    }
}

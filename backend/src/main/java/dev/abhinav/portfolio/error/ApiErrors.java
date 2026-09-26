package dev.abhinav.portfolio.error;
import dev.abhinav.portfolio.product.ProductNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataAccessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.Instant;
import java.util.*;
@RestControllerAdvice
public class ApiErrors {
    private static final Logger log=LoggerFactory.getLogger(ApiErrors.class);
    public record ErrorBody(Instant timestamp,int status,String error,String message,String path,Map<String,String> fields){}
    private ResponseEntity<ErrorBody> response(HttpStatus status,String message,HttpServletRequest request,Map<String,String> fields){
        return ResponseEntity.status(status).body(new ErrorBody(Instant.now(),status.value(),status.getReasonPhrase(),message,request.getRequestURI(),fields));
    }
    @ExceptionHandler(ProductNotFoundException.class)
    ResponseEntity<ErrorBody> missing(ProductNotFoundException e,HttpServletRequest r){return response(HttpStatus.NOT_FOUND,e.getMessage(),r,Map.of());}
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> invalid(MethodArgumentNotValidException e,HttpServletRequest r){
        Map<String,String> fields=new TreeMap<>();
        e.getBindingResult().getFieldErrors().forEach(f->fields.putIfAbsent(f.getField(),f.getDefaultMessage()==null?"Invalid value":f.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST,"Validation failed",r,fields);
    }
    @ExceptionHandler({HandlerMethodValidationException.class,MethodArgumentTypeMismatchException.class})
    ResponseEntity<ErrorBody> parameter(Exception e,HttpServletRequest r){return response(HttpStatus.BAD_REQUEST,"Invalid path or query parameter",r,Map.of());}
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErrorBody> json(HttpMessageNotReadableException e,HttpServletRequest r){return response(HttpStatus.BAD_REQUEST,"Malformed JSON or invalid field type",r,Map.of());}
    @ExceptionHandler(DataAccessException.class)
    ResponseEntity<ErrorBody> database(DataAccessException e,HttpServletRequest r){
        log.error("Database operation failed",e);
        return response(HttpStatus.SERVICE_UNAVAILABLE,"Database operation unavailable; try again later",r,Map.of());
    }
}

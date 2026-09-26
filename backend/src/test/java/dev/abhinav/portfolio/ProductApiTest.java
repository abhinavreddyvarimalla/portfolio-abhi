package dev.abhinav.portfolio;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class ProductApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Test void listsAndFiltersSeedData() throws Exception {
        mvc.perform(get("/api/products").param("name","KEYBOARD")).andExpect(status().isOk())
            .andExpect(jsonPath("$.items",hasSize(1))).andExpect(jsonPath("$.items[0].name").value("Mechanical keyboard"));
    }
    @Test void createsThenReadsPersistedProduct() throws Exception {
        String body=mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" Integration desk \",\"price\":24.50}"))
            .andExpect(status().isCreated()).andExpect(header().exists("Location")).andExpect(jsonPath("$.persisted").value(true))
            .andExpect(jsonPath("$.name").value("Integration desk")).andReturn().getResponse().getContentAsString();
        long id=json.readTree(body).get("id").asLong();
        mvc.perform(get("/api/products/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.price").value(24.5));
        mvc.perform(get("/api/products").param("name","Integration desk")).andExpect(jsonPath("$.items[0].id").value(id));
    }
    @Test void rejectsInvalidInput() throws Exception {
        for(String body:new String[]{"{\"name\":\" \",\"price\":1}","{\"name\":\"Desk\",\"price\":0}","{\"name\":\"Desk\",\"price\":1.234}","{}"}){
            mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("Bad Request")).andExpect(jsonPath("$.fields").isMap());
        }
    }
    @Test void distinguishesMissingAndInvalidIds() throws Exception {
        mvc.perform(get("/api/products/999999999")).andExpect(status().isNotFound()).andExpect(jsonPath("$.path").value("/api/products/999999999"));
        for(String id:new String[]{"abc","0","-1"})mvc.perform(get("/api/products/"+id)).andExpect(status().isBadRequest());
    }
    @Test void rejectsMalformedJson() throws Exception {
        mvc.perform(post("/api/products").contentType(MediaType.APPLICATION_JSON).content("{broken"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Malformed JSON or invalid field type"));
    }
    @Test void boundsAndPaginatesQueries() throws Exception {
        mvc.perform(get("/api/products").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.items",hasSize(1))).andExpect(jsonPath("$.totalElements",greaterThanOrEqualTo(3)));
        mvc.perform(get("/api/products").param("size","101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/products").param("page","-1")).andExpect(status().isBadRequest());
    }
    @Test void healthIsAvailable() throws Exception {mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));}
}

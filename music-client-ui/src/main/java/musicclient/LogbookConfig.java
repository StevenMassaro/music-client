package musicclient;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.zalando.logbook.HeaderFilter;
import org.zalando.logbook.HeaderFilters;

import static org.zalando.logbook.HeaderFilter.merge;

@Configuration
public class LogbookConfig {

    @Bean
    public HeaderFilter headerFilter() {
        return merge(
            HeaderFilters.defaultValue(),
            HeaderFilters.removeHeaders("cookie"));
    }
}

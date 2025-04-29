package musicclient;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.WebSocketMessageBrokerStats;

/**
 * Disable the recurring WebSocketMessageBrokerStats log message.
 */
@Configuration
public class WebSocketLoggingConfig {

	private final WebSocketMessageBrokerStats webSocketMessageBrokerStats;

	public WebSocketLoggingConfig(WebSocketMessageBrokerStats webSocketMessageBrokerStats) {
		this.webSocketMessageBrokerStats = webSocketMessageBrokerStats;
	}

	@PostConstruct
	public void init() {
		webSocketMessageBrokerStats.setLoggingPeriod(0);
	}
}

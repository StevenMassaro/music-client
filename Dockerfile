FROM eclipse-temurin:17-jre-alpine
EXPOSE 8080
ADD /music-client-ui/target/music-client-ui.jar ui.jar
ENTRYPOINT ["java", "-jar", "ui.jar"]

FROM openjdk:13-alpine
EXPOSE 8080
ADD /target/music-client-ui.jar ui.jar
ENTRYPOINT ["java", "-jar", "ui.jar"]

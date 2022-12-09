FROM alpine:3.17
RUN apk add --update openjdk17-jre
EXPOSE 8080
ADD /music-client-ui/target/music-client-ui.jar ui.jar
ENTRYPOINT ["java", "-jar", "ui.jar"]

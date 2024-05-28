FROM alpine:3.20
RUN apk add --no-cache --update openjdk17-jre-headless
EXPOSE 8080
ADD /music-client-ui/target/music-client-ui.jar ui.jar
ENTRYPOINT ["java", "-jar", "ui.jar"]

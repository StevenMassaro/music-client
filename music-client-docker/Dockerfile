FROM openjdk:13-alpine
EXPOSE 8080
ADD /start.sh start.sh
ADD /target/music-client-ui.jar ui.jar
ADD /target/music-client-router.jar router.jar
ENTRYPOINT ["ash", "start.sh"]

FROM openjdk:13
EXPOSE 8080
ADD /target/music-client.jar demo.jar
ENTRYPOINT ["java","-jar","demo.jar"]

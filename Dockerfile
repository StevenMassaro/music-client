FROM java:8
EXPOSE 8080
ADD /target/music-client.jar demo.jar
ENTRYPOINT ["java","-jar","demo.jar"]

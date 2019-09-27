FROM java:8
EXPOSE 8080
ADD /target/Music-Client.jar demo.jar
ENTRYPOINT ["java","-jar","demo.jar"]

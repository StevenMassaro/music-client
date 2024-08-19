FROM ibm-semeru-runtimes:open-21-jre
EXPOSE 8080
ADD /music-client-ui/target/music-client-ui.jar ui.jar
ENTRYPOINT ["java", "-jar", "ui.jar"]

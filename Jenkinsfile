node {
   def mvnHome
   properties([buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10')), disableConcurrentBuilds()])
   stage('Preparation') {
      sh 'curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage -d chat_id=${TELEGRAM_CHAT_ID} -d text="${JOB_BASE_NAME} - ${BUILD_NUMBER} started" || true'
      checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[url: 'http://192.168.0.117:8084/git/music/MusicClient.git']]])
      mvnHome = tool 'M3'
   }
   stage('Build') {
      sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
      // Run the maven build
      withEnv(["MVN_HOME=$mvnHome"]) {
         if (isUnix()) {
            sh '"$MVN_HOME/bin/mvn" clean deploy -P ui'
         } else {
            bat(/"%MVN_HOME%\bin\mvn" clean deploy -P ui/)
         }
      }
   }
   stage('Results') {
      //junit '**/target/surefire-reports/TEST-*.xml'
      archiveArtifacts 'target/*.jar'
      sh 'curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage -d chat_id=${TELEGRAM_CHAT_ID} -d text="${JOB_BASE_NAME} - ${BUILD_NUMBER} finished" || true'
   }
}
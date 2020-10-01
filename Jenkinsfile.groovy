node {
    def mvnHome
    properties([buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '10')), disableConcurrentBuilds()])
    stage('Preparation') {
        sh 'curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage -d chat_id=${TELEGRAM_CHAT_ID} -d text="${JOB_BASE_NAME} - ${BUILD_NUMBER} started" || true'
        checkout scm
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
        archiveArtifacts 'music-client-ui/target/*.jar'
        sh 'curl https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage -d chat_id=${TELEGRAM_CHAT_ID} -d text="${JOB_BASE_NAME} - ${BUILD_NUMBER} finished" || true'
    }
    stage('GitHub mirror') {
        cleanWs()
        def scmUrl = scm.getUserRemoteConfigs()[0].getUrl()

        dir('gh') {
            sh 'git config --global credential.helper cache'
            sh "git config --global credential.helper 'cache --timeout=3600'"
            git credentialsId: 'GitBucketReadOnly', url: scmUrl

            sh "git clone --bare ${scmUrl}"
            dir('music.git') {
                withCredentials([usernameColonPassword(credentialsId: 'GitHubStevenMassaro', variable: 'USERPASS')]) {
                    def mirrorUrl = "https://${USERPASS}@github.com/StevenMassaro/music-client.git"
                    sh "git push --mirror ${mirrorUrl}"
                }
            }
        }
    }
}
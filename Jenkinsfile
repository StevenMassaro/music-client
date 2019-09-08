node {
   def mvnHome
   stage('Preparation') { 
      checkout([$class: 'GitSCM', branches: [[name: '*/master']], doGenerateSubmoduleConfigurations: false, extensions: [], submoduleCfg: [], userRemoteConfigs: [[url: 'http://192.168.0.117:8084/git/music/MusicClient.git']]])
      mvnHome = tool 'M3'
   }
   stage('Build') {
      // Run the maven build
      withEnv(["MVN_HOME=$mvnHome"]) {
         if (isUnix()) {
            sh '"$MVN_HOME/bin/mvn" -Dmaven.test.failure.ignore clean package -P ui'
         } else {
            bat(/"%MVN_HOME%\bin\mvn" -Dmaven.test.failure.ignore clean package -P ui/)
         }
      }
   }
   stage('Results') {
      //junit '**/target/surefire-reports/TEST-*.xml'
      archiveArtifacts 'target/*.war'
   }
   stage('Deploy') {
		sh label: '', script: '''rm -rf /webapps/${JOB_BASE_NAME}.war
		while [ -d /webapps/${JOB_BASE_NAME} ]
		do
		  sleep 1
		  echo "${JOB_BASE_NAME} not removed yet, sleeping"
		done
		cp ${WORKSPACE}/target/${JOB_BASE_NAME}.war /webapps/${JOB_BASE_NAME}.war'''   
	}
}
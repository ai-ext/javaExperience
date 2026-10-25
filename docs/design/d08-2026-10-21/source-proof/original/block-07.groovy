pipeline {
  agent any
  stages {
    stage('Verify') {
      steps { sh './gradlew --no-daemon clean test bootJar' }
    }
  }
}

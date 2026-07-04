pipeline {
    agent any

    environment {
        DOCKER = "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            stages {
                stage('Build App Image') {
                    steps {
                        bat "\"%DOCKER%\" compose build app"
                    }
                }
                stage('Validate Compose Config') {
                    steps {
                        bat "\"%DOCKER%\" compose config"
                    }
                }
            }
        }

        stage('Deploy') {
            stages {
                stage('Stop Existing Containers') {
                    steps {
                        bat "\"%DOCKER%\" compose down || exit 0"
                    }
                }
                stage('Start Database Container') {
                    steps {
                        bat "\"%DOCKER%\" compose up -d db"
                    }
                }
                stage('Wait for Database Health') {
                    steps {
                        bat "ping -n 15 127.0.0.1 > nul"
                    }
                }
                stage('Start Application Container') {
                    steps {
                        bat "\"%DOCKER%\" compose up -d app"
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                bat "\"%DOCKER%\" compose ps"
            }
        }
    }

    post {
        success {
            echo "Deployed! Visit http://localhost"
        }
        failure {
            echo "Pipeline failed. Check logs above."
        }
    }
}

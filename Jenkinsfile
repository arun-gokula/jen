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
                        sh "\"%DOCKER%\" compose build app"
                    }
                }
                stage('Validate Compose Config') {
                    steps {
                        sh "\"%DOCKER%\" compose config"
                    }
                }
            }
        }

        stage('Deploy') {
            stages {
                stage('Stop Existing Containers') {
                    steps {
                        sh "\"%DOCKER%\" compose down || exit 0"
                    }
                }
                stage('Start Database Container') {
                    steps {
                        sh "\"%DOCKER%\" compose up -d db"
                    }
                }
                stage('Wait for Database Health') {
                    steps {
                        sh "ping -n 15 127.0.0.1 > nul"
                    }
                }
                stage('Start Application Container') {
                    steps {
                        sh "\"%DOCKER%\" compose up -d app"
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                sh "\"%DOCKER%\" compose ps"
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

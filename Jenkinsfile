def dockerCmd(String args) {
    if (isUnix()) {
        sh "/usr/local/bin/docker ${args}"
    } else {
        bat "\"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe\" ${args}"
    }
}

def waitSeconds(int seconds) {
    if (isUnix()) {
        sh "sleep ${seconds}"
    } else {
        bat "ping -n ${seconds} 127.0.0.1 > nul"
    }
}

pipeline {
    agent any

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
                        dockerCmd("compose build app")
                    }
                }
                stage('Validate Compose Config') {
                    steps {
                        dockerCmd("compose config")
                    }
                }
            }
        }

        stage('Deploy') {
            stages {
                stage('Stop Existing Containers') {
                    steps {
                        script {
                            try {
                                dockerCmd("compose down")
                            } catch (e) {
                                echo "No existing containers to stop, continuing..."
                            }
                        }
                    }
                }
                stage('Start Database Container') {
                    steps {
                        dockerCmd("compose up -d db")
                    }
                }
                stage('Wait for Database Health') {
                    steps {
                        waitSeconds(20)
                    }
                }
                stage('Start Application Container') {
                    steps {
                        dockerCmd("compose up -d app")
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                dockerCmd("compose ps")
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
pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                echo 'Loading environment files from Jenkins Credentials...'
                withCredentials([
                    file(credentialsId: 'calendar-root-env', variable: 'ROOT_ENV'),
                    file(credentialsId: 'calendar-be-env-docker', variable: 'BE_ENV_DOCKER')
                ]) {
                    sh '''
                        cp "$ROOT_ENV" .env
                        cp "$BE_ENV_DOCKER" be/.env.docker
                    '''
                }
            }
        }

        stage('Build & Deploy Containers') {
            steps {
                echo 'Building and deploying application with Docker Compose...'
                sh 'docker compose -f ${COMPOSE_FILE} up --build -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Verifying running containers...'
                sh 'docker compose -f ${COMPOSE_FILE} ps'
            }
        }
    }

    post {
        always {
            echo 'Cleaning up unused images...'
            sh 'docker image prune -f'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed! Please check logs.'
        }
    }
}

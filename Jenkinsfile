pipeline {
    agent any

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

pipeline {
    agent any

    parameters {
        choice(
            name: 'ACTION',
            choices: ['DEPLOY', 'FULL_REBUILD', 'RESTART_ONLY', 'CLEANUP_IMAGES'],
            description: 'Chọn hành động muốn thực thi từ giao diện Web'
        )
        booleanParam(
            name: 'PRUNE_IMAGES_AFTER',
            defaultValue: true,
            description: 'Tự động dọn dẹp Docker Image rác sau khi hoàn thành'
        )
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Checking out branch: ${env.BRANCH_NAME}..."
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                echo 'Loading environment files from Jenkins Credentials...'
                withCredentials([
                    file(credentialsId: 'calendar-root-env', variable: 'ROOT_ENV'),
                    file(credentialsId: 'calendar-be-env-docker', variable: 'BE_ENV_DOCKER'),
                    file(credentialsId: 'calendar-fe-env-production', variable: 'FE_ENV_PRODUCTION')
                ]) {
                    sh '''
                        if [ -n "$ROOT_ENV" ] && [ -f "$ROOT_ENV" ]; then
                            cp "$ROOT_ENV" .env
                        fi
                        if [ -n "$BE_ENV_DOCKER" ] && [ -f "$BE_ENV_DOCKER" ]; then
                            cp "$BE_ENV_DOCKER" be/.env.docker
                        fi
                        if [ -n "$FE_ENV_PRODUCTION" ] && [ -f "$FE_ENV_PRODUCTION" ]; then
                            cp "$FE_ENV_PRODUCTION" fe/.env.production
                        fi
                    '''
                }
            }
        }

        stage('Execute Action') {
            steps {
                script {
                    switch(params.ACTION ?: 'DEPLOY') {
                        case 'DEPLOY':
                            echo "🚀 Deploying branch ${env.BRANCH_NAME}..."
                            sh "docker compose -f ${COMPOSE_FILE} up --build -d"
                            break
                        case 'FULL_REBUILD':
                            echo '🔄 Executing Full Rebuild (no-cache)...'
                            sh "docker compose -f ${COMPOSE_FILE} build --no-cache && docker compose -f ${COMPOSE_FILE} up -d"
                            break
                        case 'RESTART_ONLY':
                            echo '⚡ Restarting Containers...'
                            sh "docker compose -f ${COMPOSE_FILE} restart"
                            break
                        case 'CLEANUP_IMAGES':
                            echo '🧹 Executing Cleanup Images...'
                            sh 'docker image prune -f'
                            break
                    }
                }
            }
        }

        stage('Verify Deployment') {
            when {
                expression { params.ACTION != 'CLEANUP_IMAGES' }
            }
            steps {
                sh "docker compose -f ${COMPOSE_FILE} ps"
            }
        }
    }

    post {
        always {
            script {
                if (params.PRUNE_IMAGES_AFTER) {
                    sh 'docker image prune -f || true'
                }
            }
        }
        success {
            echo "🚀 Pipeline for branch ${env.BRANCH_NAME} completed successfully!"
        }
        failure {
            echo "❌ Pipeline for branch ${env.BRANCH_NAME} failed!"
        }
    }
}

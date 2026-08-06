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
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Prepare Environment') {
            steps {
                withCredentials([
                    file(credentialsId: 'calendar-root-env', variable: 'ROOT_ENV'),
                    file(credentialsId: 'calendar-be-env-docker', variable: 'BE_ENV_DOCKER')
                ]) {
                    sh 'chmod +x scripts/*.sh && ./scripts/prepare-env.sh'
                }
            }
        }

        stage('Execute Action') {
            steps {
                script {
                    switch(params.ACTION) {
                        case 'DEPLOY':
                            echo '🚀 Executing Deploy...'
                            sh './scripts/deploy.sh'
                            break
                        case 'FULL_REBUILD':
                            echo '🔄 Executing Full Rebuild (no-cache)...'
                            sh 'docker compose -f ${COMPOSE_FILE} build --no-cache && docker compose -f ${COMPOSE_FILE} up -d'
                            break
                        case 'RESTART_ONLY':
                            echo '⚡ Restarting Containers...'
                            sh 'docker compose -f ${COMPOSE_FILE} restart'
                            break
                        case 'CLEANUP_IMAGES':
                            echo '🧹 Executing Cleanup Images...'
                            sh './scripts/cleanup.sh'
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
                sh './scripts/verify.sh'
            }
        }
    }

    post {
        always {
            script {
                if (params.PRUNE_IMAGES_AFTER) {
                    sh './scripts/cleanup.sh'
                }
            }
        }
        success {
            echo '🚀 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Please check logs.'
        }
    }
}

pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '10', daysToKeepStr: '7'))
        disableConcurrentBuilds()
    }

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
        booleanParam(
            name: 'BUILD_ANDROID',
            defaultValue: false,
            description: 'Build Android APK (Debug) sau khi deploy'
        )
    }

    triggers {
        githubPush()
    }

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        ANDROID_SDK_ROOT = '/opt/android-sdk'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Checking out branch: ${env.BRANCH_NAME}..."
                checkout scm
            }
        }

        stage('Prepare Environment') {
            when {
                expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' || env.BRANCH_NAME == 'develop' }
            }
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

        stage('Deploy Production') {
            when {
                expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' }
            }
            steps {
                script {
                    switch(params.ACTION ?: 'DEPLOY') {
                        case 'DEPLOY':
                            echo "🚀 Deploying Production for branch ${env.BRANCH_NAME}..."
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

        stage('Verify Feature Branch') {
            when {
                not {
                    expression { env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master' }
                }
            }
            steps {
                echo "🔍 Verifying & Testing feature branch: ${env.BRANCH_NAME}"
                echo "Safe mode: Skipping Production deployment for non-main branch."
            }
        }

        stage('Verify Deployment') {
            when {
                expression { (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') && params.ACTION != 'CLEANUP_IMAGES' }
            }
            steps {
                sh "docker compose -f ${COMPOSE_FILE} ps"
            }
        }

        stage('Setup Android Build Tools') {
            when {
                expression { params.BUILD_ANDROID == true }
            }
            steps {
                echo '🔧 Cài đặt Node.js và Android SDK (nếu chưa có)...'
                sh 'chmod +x scripts/setup-android-tools.sh && bash scripts/setup-android-tools.sh'
            }
        }

        stage('Build Android APK (Debug)') {
            when {
                expression { params.BUILD_ANDROID == true }
            }
            steps {
                withCredentials([
                    file(credentialsId: 'calendar-android-google-services', variable: 'GOOGLE_SERVICES_JSON'),
                    file(credentialsId: 'calendar-fe-env-production', variable: 'FE_ENV_PRODUCTION')
                ]) {
                    sh '''
                        # Đảm bảo fe/.env.production có VITE_ONESIGNAL_APP_ID trước khi Vite build
                        if [ -n "$FE_ENV_PRODUCTION" ] && [ -f "$FE_ENV_PRODUCTION" ]; then
                            cp "$FE_ENV_PRODUCTION" fe/.env.production
                            echo "✅ fe/.env.production đã được inject!"
                        fi
                        chmod +x scripts/build-android-debug.sh && bash scripts/build-android-debug.sh
                    '''
                }
                archiveArtifacts(
                    artifacts: 'fe/android/app/build/outputs/apk/debug/app-debug.apk',
                    fingerprint: true,
                    allowEmptyArchive: false
                )
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

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

    // triggers {
    //     githubPush()
    // }

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
                script {
                    def s3Loaded = false
                    echo '📦 Attempting to load environment files from S3...'
                    try {
                        withCredentials([
                            file(credentialsId: 'calendar-s3-env-reader', variable: 'AWS_ENV_FILE')
                        ]) {
                            sh '''
                                set -e

                                # Load các biến AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_DEFAULT_REGION từ Secret file
                                set -a
                                . "$AWS_ENV_FILE"
                                set +a

                                if [ -z "$AWS_S3_BUCKET" ]; then
                                    echo "AWS_S3_BUCKET is empty or missing in Secret file!" >&2
                                    exit 1
                                fi

                                echo "Target S3 Bucket: s3://${AWS_S3_BUCKET}"
                                
                                mkdir -p be fe

                                if command -v aws >/dev/null 2>&1; then
                                    echo "Using host AWS CLI..."
                                    aws s3 cp "s3://${AWS_S3_BUCKET}/.env" .env
                                    aws s3 cp "s3://${AWS_S3_BUCKET}/.env.docker" be/.env.docker
                                    aws s3 cp "s3://${AWS_S3_BUCKET}/.env.production" fe/.env.production
                                elif command -v docker >/dev/null 2>&1; then
                                    echo "AWS CLI not found on host, using amazon/aws-cli container..."
                                    docker run --rm \
                                        -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
                                        -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
                                        -e AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" \
                                        -v "$(pwd):/aws_ws" \
                                        -w /aws_ws \
                                        amazon/aws-cli s3 cp "s3://${AWS_S3_BUCKET}/.env" .env
                                    docker run --rm \
                                        -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
                                        -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
                                        -e AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" \
                                        -v "$(pwd):/aws_ws" \
                                        -w /aws_ws \
                                        amazon/aws-cli s3 cp "s3://${AWS_S3_BUCKET}/.env.docker" be/.env.docker
                                    docker run --rm \
                                        -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
                                        -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
                                        -e AWS_DEFAULT_REGION="$AWS_DEFAULT_REGION" \
                                        -v "$(pwd):/aws_ws" \
                                        -w /aws_ws \
                                        amazon/aws-cli s3 cp "s3://${AWS_S3_BUCKET}/.env.production" fe/.env.production
                                else
                                    echo "ERROR: Neither 'aws' CLI nor 'docker' is available to pull env files from S3!" >&2
                                    exit 1
                                fi

                                # Kiểm tra đảm bảo các file đã tải về và không bị rỗng
                                if [ ! -s .env ] || [ ! -s be/.env.docker ] || [ ! -s fe/.env.production ]; then
                                    echo "ERROR: One or more env files from S3 are missing or empty!" >&2
                                    exit 1
                                fi

                                echo "Environment files loaded successfully from S3."
                            '''
                        }
                        s3Loaded = true
                        echo '✅ Successfully loaded environment files from S3!'
                    } catch (Exception e) {
                        echo "⚠️ S3 load failed or 'calendar-s3-env-reader' not found: ${e.message}"
                        echo "🔄 Switching to fallback: Loading from Jenkins Credentials..."
                    }

                    if (!s3Loaded) {
                        withCredentials([
                            file(credentialsId: 'calendar-root-env', variable: 'ROOT_ENV'),
                            file(credentialsId: 'calendar-be-env-docker', variable: 'BE_ENV_DOCKER'),
                            file(credentialsId: 'calendar-fe-env-production', variable: 'FE_ENV_PRODUCTION')
                        ]) {
                            sh '''
                                set -e
                                mkdir -p be fe
                                if [ -n "$ROOT_ENV" ] && [ -f "$ROOT_ENV" ]; then
                                    cp "$ROOT_ENV" .env
                                    echo "Loaded .env from Jenkins Credentials"
                                fi
                                if [ -n "$BE_ENV_DOCKER" ] && [ -f "$BE_ENV_DOCKER" ]; then
                                    cp "$BE_ENV_DOCKER" be/.env.docker
                                    echo "Loaded be/.env.docker from Jenkins Credentials"
                                fi
                                if [ -n "$FE_ENV_PRODUCTION" ] && [ -f "$FE_ENV_PRODUCTION" ]; then
                                    cp "$FE_ENV_PRODUCTION" fe/.env.production
                                    echo "Loaded fe/.env.production from Jenkins Credentials"
                                fi
                            '''
                        }
                        echo '✅ Successfully loaded environment files from Jenkins Credentials (Fallback)!'
                    }
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
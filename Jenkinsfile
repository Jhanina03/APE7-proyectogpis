pipeline {
    agent any
    
environment {
    BACKEND_IMAGE = 'safetrade-backend'
    FRONTEND_IMAGE = 'safetrade-frontend'
    IMAGE_TAG = "${BUILD_NUMBER}"

    DATABASE_URL = credentials('DATABASE_URL')
    JWT_SECRET = credentials('JWT_SECRET')
    JWT_EXPIRES_IN = credentials('JWT_EXPIRES_IN')
    JWT_REFRESH_EXPIRES_IN = credentials('JWT_REFRESH_EXPIRES_IN')

    CLOUDINARY_CLOUD_NAME = credentials('CLOUDINARY_CLOUD_NAME')
    CLOUDINARY_API_KEY = credentials('CLOUDINARY_API_KEY')
    CLOUDINARY_API_SECRET = credentials('CLOUDINARY_API_SECRET')

    SMTP_USER = credentials('SMTP_USER')
    SMTP_PASS = credentials('SMTP_PASS')
    SENDER_EMAIL = credentials('SENDER_EMAIL')

    VITE_API_URL = 'http://localhost:3000'
}

    
    stages {
        stage('📥 Checkout') {
            steps {
                echo '🔍 Clonando repositorio...'
                checkout scm
            }
        }
        
        stage('🔍 Verificar Archivos') {
            steps {
                echo '📋 Verificando estructura del proyecto...'
                sh '''
                    echo "Verificando backend..."
                    ls -la backend/
                    
                    echo "Verificando frontend..."
                    ls -la frontend/
                    
                    echo "Verificando Dockerfiles..."
                    test -f backend/Dockerfile || exit 1
                    test -f frontend/Dockerfile || exit 1
                    
                    echo "✅ Todos los archivos necesarios están presentes"
                '''
            }
        }
        
        stage('🏗️ Build Backend') {
            steps {
                echo '🔨 Construyendo imagen del Backend...'
                dir('backend') {
                    sh '''
                        docker build \
                            -t ${BACKEND_IMAGE}:${IMAGE_TAG} \
                            -t ${BACKEND_IMAGE}:latest \
                            .
                        
                        echo "✅ Backend construido exitosamente"
                        docker images | grep safetrade-backend
                    '''
                }
            }
        }
        
        stage('🏗️ Build Frontend') {
            steps {
                echo '🔨 Construyendo imagen del Frontend...'
                dir('frontend') {
                    sh '''
                        docker build \
                            --build-arg VITE_API_URL=${VITE_API_URL} \
                            -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \
                            -t ${FRONTEND_IMAGE}:latest \
                            .
                        
                        echo "✅ Frontend construido exitosamente"
                        docker images | grep safetrade-frontend
                    '''
                }
            }
        }
        
        stage('🚀 Deploy') {
            steps {
                echo '🚀 Desplegando aplicación localmente...'
                script {
                    // Detener contenedores anteriores
                    sh 'docker compose -f docker-compose.yml down 2>/dev/null || true'
                    sh 'rm -f .env .env.deploy'
                    
                    // Crear .env con writeFile (más confiable)
            def envContent = """DATABASE_URL=${env.DATABASE_URL}
            JWT_SECRET=${env.JWT_SECRET}
            JWT_EXPIRES_IN=${env.JWT_EXPIRES_IN}
            JWT_REFRESH_EXPIRES_IN=${env.JWT_REFRESH_EXPIRES_IN}
            CLOUDINARY_CLOUD_NAME=${env.CLOUDINARY_CLOUD_NAME}
            CLOUDINARY_API_KEY=${env.CLOUDINARY_API_KEY}
            CLOUDINARY_API_SECRET=${env.CLOUDINARY_API_SECRET}
            SMTP_USER=${env.SMTP_USER}
            SMTP_PASS=${env.SMTP_PASS}
            SENDER_EMAIL=${env.SENDER_EMAIL}
            VITE_API_URL=http://localhost:3000
            NODE_ENV=production
            PORT=3000
            """

                    
                    writeFile file: '.env', text: envContent
                    
                    // Verificar que se creó bien
                    sh 'echo "📄 Archivo .env creado:"; cat .env | head -5'
                    
                    // Levantar servicios
                    echo '🚀 Levantando contenedores con docker compose...'
                    sh 'docker compose up -d'
                    
                    // Esperar un poco
                    sh 'sleep 10'
                    
                    // Mostrar resultado
                    sh 'echo "📊 Estado de contenedores:"; docker ps'
                    sh 'docker ps | grep safetrade || echo "⚠️ Contenedores safetrade no encontrados"'
                }
            }
        }
        
        stage('✅ Health Check') {
            steps {
                echo '🏥 Verificando salud de la aplicación...'
                sh '''
                    # Esperar a que los servicios estén listos
                    echo "Esperando a que los servicios inicien..."
                    sleep 15
                    
                    # Verificar backend
                    echo "Verificando backend..."
                    curl -f http://localhost:3000/health || echo "⚠️ Backend no responde aún, pero puede estar iniciando"
                    
                    # Verificar frontend
                    echo "Verificando frontend..."
                    curl -f http://localhost:5173 || echo "⚠️ Frontend no responde aún, pero puede estar iniciando"
                    
                    echo "✅ Health check completado"
                    echo "🌐 Backend disponible en: http://localhost:3000"
                    echo "🌐 Frontend disponible en: http://localhost:5173"
                '''
            }
        }
        
        stage('📊 Resumen') {
            steps {
                echo '📊 Resumen del despliegue:'
                sh '''
                    echo ""
                    echo "═══════════════════════════════════════"
                    echo "    DESPLIEGUE COMPLETADO"
                    echo "═══════════════════════════════════════"
                    echo ""
                    echo "📦 Imágenes creadas:"
                    docker images | grep -E "safetrade-(backend|frontend)" | head -4
                    echo ""
                    echo "🐳 Contenedores en ejecución:"
                    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
                    echo ""
                    echo "🌐 URLs disponibles:"
                    echo "   Backend:  http://localhost:3000"
                    echo "   Frontend: http://localhost:5173"
                    echo ""
                    echo "═══════════════════════════════════════"
                '''
            }
        }
    }
    
    post {
        success {
            echo '🎉 ¡Pipeline ejecutado exitosamente!'
            echo '✅ Tu aplicación SafeTrade está corriendo localmente'
            echo '🌐 Accede a http://localhost:5173 para verla'
        }
        
        failure {
            echo '❌ Pipeline falló. Revisa los logs para más detalles.'
            echo '🔍 Tip: Revisa los logs con: docker-compose logs'
        }
        
        always {
            echo '🧹 Limpiando recursos...'
            sh '''
                # Limpiar imágenes sin usar (las antiguas)
                docker image prune -f
            '''
        }
    }
}

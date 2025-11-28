FROM jenkins/jenkins:lts

USER root

# Instalar Docker CLI + Buildx + Compose Plugin
RUN apt-get update && \
    apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --batch --dearmor -o /usr/share/keyrings/docker.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list && \
    apt-get update && \
    apt-get install -y docker-ce-cli docker-buildx-plugin docker-compose-plugin && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Agregar jenkins al grupo docker (por si luego usas el socket)
RUN groupadd -f docker && usermod -aG docker jenkins

USER jenkins

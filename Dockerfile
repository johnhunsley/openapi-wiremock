# Use OpenJDK base image for running WireMock
FROM openjdk:17-slim

# Install Node.js and npm
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Node.js files
COPY package*.json ./
RUN npm install
COPY generateWireMockStubs.js .

# Install WireMock standalone
ENV WIREMOCK_VERSION=3.6.0
RUN mkdir /wiremock && \
    curl -L -o /wiremock/wiremock.jar https://repo1.maven.org/maven2/com/github/tomakehurst/wiremock-jre8-standalone/${WIREMOCK_VERSION}/wiremock-jre8-standalone-${WIREMOCK_VERSION}.jar

# Copy OpenAPI file at build time (optional)
COPY openapi.yaml ./openapi.yaml

# Generate stubs (optional, or generate at runtime)
RUN node generateWireMockStubs.js openapi.yaml || echo "No openapi.yaml at build time"

# Expose WireMock port
EXPOSE 8080

# CMD can be overridden at runtime, but defaults to starting WireMock
CMD ["java", "-jar", "/wiremock/wiremock.jar", "--root-dir", "/app/wiremock", "--verbose"]

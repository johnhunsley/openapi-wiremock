# openapi-wiremock
A node.js project which reads an OpenAPI 3.0 spec' file and translates it into wiremock stubs

Build the docker image 

docker build -t openapi-wiremock .

run the container

docker run --rm -p 8080:8080 \
  -v $(pwd)/openapi.yaml:/app/openapi.yaml \
  -v $(pwd)/wiremock:/app/wiremock \
  openapi-wiremock \
  sh -c "node generateWireMockStubs.js openapi.yaml && java -jar /wiremock/wiremock.jar --root-dir /app/wiremock --verbose"

This will:
Generate stubs from openapi.yaml and serve them using WireMock on port 8080


const fs = require('fs-extra');
const yaml = require('js-yaml');
const path = require('path');

const inputSpec = process.argv[2];
const outputDir = path.resolve(__dirname, 'wiremock/mappings');

if (!inputSpec) {
  console.error('Usage: node generateWireMockStubs.js <openapi-spec.yaml>');
  process.exit(1);
}

async function generateStubs(openApiSpec) {
  const paths = openApiSpec.paths;
  const components = openApiSpec.components || {};
  const schemas = components.schemas || {};

  await fs.ensureDir(outputDir);

  for (const [uri, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods)) {
      const stub = {
        request: {
          method: method.toUpperCase(),
          url: uri.replace(/{([^}]+)}/g, (_, param) => `:${param}`)
        },
        response: {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          },
          jsonBody: {}
        }
      };

      // Set realistic stub values
      if (method.toLowerCase() === 'post') {
        stub.response.status = 201;
      }

      // Attempt to load example response schema
      const successResponse = details.responses?.['200'] || details.responses?.['201'];
      const ref = successResponse?.content?.['application/json']?.schema?.$ref;
      if (ref) {
        const schemaName = ref.split('/').pop();
        const example = generateExampleFromSchema(schemas[schemaName]);
        if (example) {
          stub.response.jsonBody = example;
        }
      }

      const filename = `${method.toUpperCase()}_${uri.replace(/[\/{}]/g, '_')}.json`;
      const filePath = path.join(outputDir, filename);
      await fs.writeJson(filePath, stub, { spaces: 2 });
      console.log(`✔ Generated stub: ${filename}`);
    }
  }
}

function generateExampleFromSchema(schema) {
  if (!schema || !schema.properties) return null;
  const example = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.example !== undefined) {
      example[key] = prop.example;
    } else if (prop.type === 'string') {
      example[key] = `${key}-string`;
    } else if (prop.type === 'integer') {
      example[key] = 1;
    } else if (prop.type === 'boolean') {
      example[key] = true;
    } else if (prop.type === 'array') {
      example[key] = [];
    } else if (prop.type === 'object') {
      example[key] = {};
    }
  }
  return example;
}

async function main() {
  try {
    const fileContents = await fs.readFile(inputSpec, 'utf8');
    const openApiSpec = yaml.load(fileContents);
    await generateStubs(openApiSpec);
    console.log('\n✅ WireMock stubs generated in ./wiremock/mappings');
  } catch (err) {
    console.error('❌ Error generating stubs:', err);
  }
}

main();

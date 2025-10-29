const { BlobServiceClient } = require('@azure/storage-blob');

function getBlobService() {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error('AZURE_STORAGE_CONNECTION_STRING não configurado');
  return BlobServiceClient.fromConnectionString(connectionString);
}

async function getContainerClient(containerName) {
  const client = getBlobService();
  const container = client.getContainerClient(containerName);
  await container.createIfNotExists({ access: 'container' }).catch(() => {});
  return container;
}

async function uploadBuffer(containerName, blobPath, buffer, contentType) {
  const container = await getContainerClient(containerName);
  const blockBlob = container.getBlockBlobClient(blobPath);
  await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType || 'application/octet-stream' } });
  return { url: blockBlob.url, name: blockBlob.name };
}

async function listByPrefix(containerName, prefix) {
  const container = await getContainerClient(containerName);
  const out = [];
  for await (const blob of container.listBlobsFlat({ prefix })) {
    const client = container.getBlobClient(blob.name);
    out.push({ name: blob.name, url: client.url, contentType: blob.properties.contentType, size: blob.properties.contentLength });
  }
  return out;
}

async function deleteBlob(containerName, blobName) {
  const container = await getContainerClient(containerName);
  const client = container.getBlobClient(blobName);
  await client.deleteIfExists();
  return true;
}

function getBlobUrl(containerName, blobName) {
  const account = getBlobService();
  // Obter URL via client para preservar formato correto
  const containerClient = account.getContainerClient(containerName);
  return containerClient.getBlobClient(blobName).url;
}

module.exports = { uploadBuffer, listByPrefix, deleteBlob, getBlobUrl };

// Download de blob para Buffer (usado para proxy autenticado de conteúdo)
async function downloadToBuffer(containerName, blobName) {
  const container = await getContainerClient(containerName);
  const client = container.getBlobClient(blobName);
  const response = await client.download();
  const chunks = [];
  if (response.readableStreamBody) {
    for await (const chunk of response.readableStreamBody) {
      chunks.push(chunk);
    }
  }
  const buffer = Buffer.concat(chunks);
  const contentType = response.contentType || (response._response && response._response.parsedHeaders && response._response.parsedHeaders.contentType) || 'application/octet-stream';
  return { buffer, contentType, size: buffer.length, name: blobName };
}

module.exports.downloadToBuffer = downloadToBuffer;



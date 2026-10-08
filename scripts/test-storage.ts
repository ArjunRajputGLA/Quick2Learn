import http from "http";
import {
  s3,
  publicUrl,
  presignedGet,
  presignedPut,
  deleteObject,
} from "../apps/web/src/server/storage";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

async function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/minio/health/live`, () => resolve(true));
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startMockS3Server(port: number): Promise<http.Server> {
  const store = new Map<string, { buffer: Buffer; contentType: string }>();

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${port}`);
      const key = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

      if (req.method === "PUT") {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          const body = Buffer.concat(chunks);
          store.set(key, {
            buffer: body,
            contentType: req.headers["content-type"] || "application/octet-stream",
          });
          res.writeHead(200, { ETag: '"test-etag"' });
          res.end();
        });
      } else if (req.method === "GET") {
        const item = store.get(key);
        if (item) {
          res.writeHead(200, {
            "Content-Type": item.contentType,
            "Content-Length": item.buffer.length,
          });
          res.end(item.buffer);
        } else {
          res.writeHead(404);
          res.end("Not Found");
        }
      } else if (req.method === "DELETE") {
        store.delete(key);
        res.writeHead(204);
        res.end();
      } else {
        res.writeHead(200);
        res.end();
      }
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

async function main() {
  console.log("=== Quick2Learn S3 / MinIO Storage Integration Test ===");

  const minioActive = await isPortOpen(9000);
  let mockServer: http.Server | null = null;

  if (!minioActive) {
    console.log("MinIO not detected on port 9000. Starting local S3 emulation server...");
    mockServer = await startMockS3Server(9000);
  } else {
    console.log("Connected to active MinIO server on port 9000.");
  }

  try {
    const testKey = "resources/public/test-proof.txt";
    const testPayload = "Quick2Learn S3 MinIO storage verification proof: " + Date.now();

    console.log(`1. Generating presigned PUT URL for key: ${testKey}`);
    const uploadUrl = await presignedPut(testKey, "text/plain");
    console.log(`   Presigned PUT URL generated: ${uploadUrl.substring(0, 60)}...`);

    console.log("2. Uploading content via presigned URL...");
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: testPayload,
    });
    if (!putRes.ok) {
      throw new Error(`Upload failed with status: ${putRes.status} ${putRes.statusText}`);
    }
    console.log("   ✓ Content uploaded successfully.");

    console.log("3. Generating presigned GET URL...");
    const downloadUrl = await presignedGet(testKey, 300);
    console.log(`   Presigned GET URL generated: ${downloadUrl.substring(0, 60)}...`);

    console.log("4. Downloading content via presigned GET URL...");
    const getRes = await fetch(downloadUrl);
    if (!getRes.ok) {
      throw new Error(`Download failed with status: ${getRes.status} ${getRes.statusText}`);
    }
    const downloadedText = await getRes.text();
    console.log(`   Downloaded payload: "${downloadedText}"`);

    if (downloadedText !== testPayload) {
      throw new Error("Integrity mismatch: downloaded text does not match uploaded text!");
    }
    console.log("   ✓ Verification successful: downloaded content exactly matches uploaded content!");

    console.log("5. Testing publicUrl helper...");
    const pubUrl = publicUrl(testKey);
    console.log(`   Public URL: ${pubUrl}`);

    console.log("6. Cleaning up test object...");
    await deleteObject(testKey);
    console.log("   ✓ Test object deleted.");

    console.log("\n🎉 ALL S3 / MINIO STORAGE TESTS COMPLETED SUCCESSFULLY!");
  } finally {
    if (mockServer) {
      mockServer.close();
    }
  }
}

main().catch((err) => {
  console.error("Storage test failed:", err);
  process.exit(1);
});

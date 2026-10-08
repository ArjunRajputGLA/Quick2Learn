import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";
const region = process.env.S3_REGION || "us-east-1";
const accessKeyId = process.env.S3_ACCESS_KEY_ID || "minioadmin";
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "minioadmin";
const publicBucket = process.env.S3_PUBLIC_BUCKET || "q2l-public";
const privateBucket = process.env.S3_PRIVATE_BUCKET || "q2l-private";
const publicBaseUrl =
  process.env.S3_PUBLIC_BASE_URL || `${endpoint.replace(/\/$/, "")}/${publicBucket}`;

export const s3 = new S3Client({
  endpoint,
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export function getBucketForKey(key: string): string {
  // Key layout: covers/, faculty/, testimonials/, results/ and public resources/ in q2l-public
  // enrolled-only resources/ in q2l-private
  if (key.startsWith("resources/private/") || key.startsWith("private/")) {
    return privateBucket;
  }
  return publicBucket;
}

export function publicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return `${publicBaseUrl.replace(/\/$/, "")}/${cleanKey}`;
}

export async function presignedGet(key: string, seconds = 3600): Promise<string> {
  const bucket = getBucketForKey(key);
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: seconds });
}

export async function presignedPut(
  key: string,
  contentType: string,
  maxBytes?: number,
): Promise<string> {
  const bucket = getBucketForKey(key);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ...(maxBytes ? { ContentLength: maxBytes } : {}),
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

export async function deleteObject(key: string): Promise<void> {
  const bucket = getBucketForKey(key);
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await s3.send(command);
}

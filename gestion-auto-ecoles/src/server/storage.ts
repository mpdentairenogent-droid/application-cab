import "server-only";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Abstraction de stockage S3-compatible. En développement : MinIO (docker-compose.yml).
// En production : un vrai fournisseur S3/R2 — seuls les identifiants/l'endpoint changent,
// ce fichier reste identique. Aucun document n'est jamais servi depuis une URL publique
// fixe : uniquement via getSignedDocumentUrl(), qui génère une URL temporaire signée.

const BUCKET = process.env.STORAGE_BUCKET ?? "documents-auto-ecoles";

const s3Client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,
  region: process.env.STORAGE_REGION ?? "eu-west-3",
  forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "",
  },
});

let bucketEnsured = false;

/** Crée le bucket s'il n'existe pas encore (confort de développement avec MinIO). */
async function ensureBucketExists() {
  if (bucketEnsured) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET })).catch(() => {
      // Une erreur ici (ex. droits insuffisants sur un vrai S3 de production, où le bucket
      // doit être créé à l'avance par l'infrastructure) ne doit pas bloquer l'upload si le
      // bucket existe déjà réellement — l'upload suivant échouera explicitement sinon.
    });
  }
  bucketEnsured = true;
}

function extensionOf(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? `.${parts[parts.length - 1]!.toLowerCase()}` : "";
}

/** Construit une clé de stockage unique et non devinable, groupée par catégorie de document. */
export function buildStorageKey(category: string, originalFileName: string): string {
  return `${category}/${randomUUID()}${extensionOf(originalFileName)}`;
}

export async function uploadDocumentBytes(key: string, body: Buffer, contentType: string): Promise<void> {
  await ensureBucketExists();
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** URL de téléchargement temporaire et signée. Jamais d'accès direct/public au bucket. */
export async function getSignedDocumentUrl(key: string, expiresInSeconds = 300): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

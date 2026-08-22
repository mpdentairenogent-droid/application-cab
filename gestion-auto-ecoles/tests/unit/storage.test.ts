import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import {
  buildStorageKey,
  uploadDocumentBytes,
  getSignedDocumentUrl,
  MAX_DOCUMENT_SIZE_BYTES,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from "@/server/storage";

// MinIO n'est pas accessible dans certains environnements (sandbox, CI sans Docker) : ces tests
// simulent le client S3 (aws-sdk-client-mock) plutôt que de dépendre d'un vrai serveur MinIO.
const s3Mock = mockClient(S3Client);

beforeEach(() => {
  s3Mock.reset();
});

describe("buildStorageKey", () => {
  it("préfixe la clé par la catégorie et conserve l'extension d'origine (en minuscules)", () => {
    const key = buildStorageKey("PIECE_IDENTITE", "carte-identite.PDF");
    expect(key).toMatch(/^PIECE_IDENTITE\/[0-9a-f-]{36}\.pdf$/);
  });

  it("génère une clé différente à chaque appel (non devinable)", () => {
    const a = buildStorageKey("PHOTO", "photo.jpg");
    const b = buildStorageKey("PHOTO", "photo.jpg");
    expect(a).not.toBe(b);
  });

  it("gère un nom de fichier sans extension", () => {
    const key = buildStorageKey("AUTRE", "sansextension");
    expect(key).toMatch(/^AUTRE\/[0-9a-f-]{36}$/);
  });
});

describe("uploadDocumentBytes", () => {
  it("crée le bucket au premier appel si nécessaire, puis met la vérification en cache", async () => {
    s3Mock.on(HeadBucketCommand).rejects(new Error("bucket introuvable"));
    s3Mock.on(CreateBucketCommand).resolves({});
    s3Mock.on(PutObjectCommand).resolves({});

    await uploadDocumentBytes("PHOTO/premier.jpg", Buffer.from("contenu"), "image/jpeg");
    expect(s3Mock.commandCalls(HeadBucketCommand)).toHaveLength(1);
    expect(s3Mock.commandCalls(CreateBucketCommand)).toHaveLength(1);

    await uploadDocumentBytes("PHOTO/second.jpg", Buffer.from("contenu2"), "image/jpeg");
    // Le bucket est désormais en cache (module storage.ts) : pas de nouvelle vérification.
    expect(s3Mock.commandCalls(HeadBucketCommand)).toHaveLength(1);

    const putCalls = s3Mock.commandCalls(PutObjectCommand);
    expect(putCalls).toHaveLength(2);
    expect(putCalls[0]?.args[0].input).toMatchObject({ Key: "PHOTO/premier.jpg", ContentType: "image/jpeg" });
    expect(putCalls[1]?.args[0].input).toMatchObject({ Key: "PHOTO/second.jpg", ContentType: "image/jpeg" });
  });
});

describe("getSignedDocumentUrl", () => {
  it("génère une URL temporaire signée (jamais un accès direct au bucket)", async () => {
    const url = await getSignedDocumentUrl("PHOTO/test-key.jpg", 120);
    expect(url).toContain("X-Amz-Signature");
    expect(url).toContain("X-Amz-Expires=120");
  });
});

describe("constantes de validation des documents", () => {
  it("limite la taille à 10 Mo et n'autorise que PDF/JPEG/PNG/WebP", () => {
    expect(MAX_DOCUMENT_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(ALLOWED_DOCUMENT_MIME_TYPES).toEqual(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
  });
});

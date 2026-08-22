import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";

describe("Hachage des mots de passe (authentification)", () => {
  it("un mot de passe haché n'est jamais stocké en clair et se vérifie correctement", async () => {
    const password = "Demo1234!";
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await bcrypt.hash("Demo1234!", 10);
    expect(await bcrypt.compare("MauvaisMotDePasse!", hash)).toBe(false);
  });
});

import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { contactMessages } from "../db/schema.js";
import type { CreateContactInput } from "../schemas/contact.schema.js";

export const contactService = {
  async submit(data: CreateContactInput) {
    const [created] = await db
      .insert(contactMessages)
      .values(data)
      .returning();
    return created;
  },

  async list() {
    return db
      .select()
      .from(contactMessages)
      .orderBy(contactMessages.createdAt);
  },

  async markRead(id: string) {
    const [updated] = await db
      .update(contactMessages)
      .set({ isRead: true })
      .where(eq(contactMessages.id, id))
      .returning();
    return updated ?? null;
  },

  async remove(id: string) {
    const [deleted] = await db
      .delete(contactMessages)
      .where(eq(contactMessages.id, id))
      .returning({ id: contactMessages.id });
    return deleted ?? null;
  },
};

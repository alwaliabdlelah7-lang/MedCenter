import admin from "firebase-admin";

export async function performSeeding(db: any) {
  if (!db) return { success: false, error: "Firebase not initialized" };
  try {
    const { 
      INITIAL_DEPARTMENTS, 
      INITIAL_CLINICS, 
      INITIAL_DOCTORS, 
      INITIAL_PATIENTS,
      INITIAL_USERS,
      INITIAL_NURSES,
      INITIAL_OPERATIONS,
      YEMEN_SERVICES,
      YEMEN_LAB_TESTS,
      YEMEN_MEDICINES
    } = await import("../data/seedData.ts");

    const seedTask = async (collection: string, data: any[]) => {
      const colRef = db.collection(collection);
      const snapshot = await colRef.limit(1).get();
      if (snapshot.empty) {
        console.log(`Seeding ${collection}...`);
        const batch = db.batch();
        data.forEach(item => {
          const docRef = item.id ? colRef.doc(item.id) : colRef.doc();
          batch.set(docRef, { ...item, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        });
        await batch.commit();
      }
    };

    await Promise.all([
      seedTask("departments", INITIAL_DEPARTMENTS),
      seedTask("clinics", INITIAL_CLINICS),
      seedTask("doctors", INITIAL_DOCTORS),
      seedTask("patients", INITIAL_PATIENTS),
      seedTask("users", INITIAL_USERS),
      seedTask("nurses", INITIAL_NURSES),
      seedTask("operations", INITIAL_OPERATIONS),
      seedTask("services", YEMEN_SERVICES),
      seedTask("master_lab_tests", YEMEN_LAB_TESTS),
      seedTask("master_medicines", YEMEN_MEDICINES),
    ]);
    return { success: true };
  } catch (error) {
    console.error("Seeding error:", error);
    return { success: false, error: (error as Error).message };
  }
}

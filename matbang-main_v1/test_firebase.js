import admin from "firebase-admin";
import serviceAccount from "./key_firebase/serviceAccountKey.json" with { type: "json" };

console.log("Service Account Project ID:", serviceAccount.project_id);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
console.log("Admin Project ID:", admin.app().options.credential.projectId);

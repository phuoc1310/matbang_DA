import { admin } from './config/firebase.js';

async function updatePassword() {
  try {
    const email = 'admin@renthub.vn';
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Successfully fetched user data: ${userRecord.toJSON()}`);
    
    await admin.auth().updateUser(userRecord.uid, {
      password: '123456@'
    });
    
    console.log('Successfully updated password to 123456@');
  } catch (error) {
    console.log('Error fetching user data or updating password:', error);
  }
  process.exit();
}

updatePassword();

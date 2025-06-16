const fs = require('fs');
const path = require('path');

// Directory where uploads will be stored
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

// Create the uploads directory if it doesn't exist
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory at:', uploadsDir);
  } else {
    console.log('✅ Uploads directory already exists at:', uploadsDir);
  }
  
  // Verify we can write to the directory
  const testFile = path.join(uploadsDir, '.test-write-access');
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ Uploads directory is writable');
  
} catch (err) {
  console.error('❌ Error setting up uploads directory:', err);
  process.exit(1);
}

console.log('🚀 Upload system ready'); 
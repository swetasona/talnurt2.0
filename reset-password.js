require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    // Email of the user whose password we want to reset
    const userEmail = 'testuser@gmail.com';
    
    // New password
    const newPassword = 'Password123!';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { password: hashedPassword },
    });
    
    console.log(`Password reset successful for user: ${updatedUser.name} (${updatedUser.email})`);
    console.log(`New credentials: ${userEmail} / ${newPassword}`);
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword(); 
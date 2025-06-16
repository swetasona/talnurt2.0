# Troubleshooting Scripts

This directory contains scripts to help troubleshoot and debug API functionality.

## Testing Recruiter Deletion

If you're experiencing issues with deleting recruiters from the admin interface, you can use the `test-delete-recruiter.ts` script to directly test the API functionality.

### Prerequisites

- Node.js and npm installed
- ts-node installed (`npm install -g ts-node`)
- node-fetch installed (`npm install node-fetch`)

### Steps to Test Deletion:

1. **Get a Recruiter ID**:
   - From the Recruiters Management page, open your browser's developer tools
   - Inspect the delete button for a recruiter
   - Find the `onClick` handler that calls `handleDeleteRecruiter` with an ID
   - Copy this ID

2. **Get Your Admin Token**:
   - Open your browser's developer tools
   - Go to the Application tab
   - Find Cookies for your site
   - Copy the value of the `admin-token` cookie

3. **Update the Script**:
   - Open `test-delete-recruiter.ts`
   - Replace `YOUR_RECRUITER_ID_HERE` with the actual recruiter ID
   - Replace `YOUR_ADMIN_TOKEN_HERE` with your admin token
   - Ensure the `baseUrl` is set correctly (default is `http://localhost:3000`)

4. **Run the Script**:
   ```bash
   npx ts-node src/scripts/test-delete-recruiter.ts
   ```

5. **Check the Output**:
   - If successful, you should see a success message with the deleted user's information
   - If unsuccessful, you'll see error details that can help troubleshoot the issue

### Common Issues:

1. **Authentication Errors**:
   - Make sure your admin token is valid and not expired
   - Verify you have admin or superadmin role
   - Check the token format and ensure it's correctly copied

2. **Permission Errors**:
   - Verify your admin account has the right permissions
   - Some operations may require superadmin privileges

3. **User Not Found**:
   - Verify the recruiter ID exists
   - The user may have been deleted already

4. **Network Issues**:
   - Ensure your development server is running
   - Check the `baseUrl` is correct

If you continue to experience issues, check the server logs for more detailed error information. 
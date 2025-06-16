const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting task tables setup...');

  // First, drop the existing tables if they exist
  try {
    await prisma.$executeRaw`DROP TABLE IF EXISTS task_assignees CASCADE`;
    await prisma.$executeRaw`DROP TABLE IF EXISTS tasks CASCADE`;
    console.log('Dropped existing task tables');
  } catch (error) {
    console.error('Error dropping tables:', error);
  }

  // Create tasks table
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
        priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
        type VARCHAR(50) NOT NULL DEFAULT 'Administrative',
        due_date TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(36) NOT NULL,
        team_id VARCHAR(36),
        company_id VARCHAR(36)
      );
    `;
    console.log('Created tasks table');
  } catch (error) {
    console.error('Error creating tasks table:', error);
    return;
  }

  // Create task_assignees table
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS task_assignees (
        id VARCHAR(36) PRIMARY KEY,
        task_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(task_id, user_id)
      );
    `;
    console.log('Created task_assignees table');
  } catch (error) {
    console.error('Error creating task_assignees table:', error);
    return;
  }

  // Get company, employees and manager for sample tasks
  try {
    // Get first company
    const company = await prisma.companies.findFirst();
    if (!company) {
      console.log('No company found, please create a company first');
      return;
    }

    // Get managers
    const managers = await prisma.user.findMany({
      where: { role: 'manager', company_id: company.id },
      take: 2
    });
    
    // Get employees
    const employees = await prisma.user.findMany({
      where: { role: 'employee', company_id: company.id },
      take: 5
    });

    // Get an employer
    const employer = await prisma.user.findFirst({
      where: { role: 'employer', company_id: company.id }
    });

    if (managers.length === 0 || employees.length === 0 || !employer) {
      console.log('Not enough users found for sample tasks');
      return;
    }

    console.log(`Found company: ${company.name}`);
    console.log(`Found ${managers.length} managers and ${employees.length} employees`);

    // Create sample tasks
    const taskTypes = ['Administrative', 'Recruitment', 'Onboarding', 'Performance Review', 'Training'];
    const taskPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    const taskStatuses = ['Not Started', 'In Progress', 'Completed', 'Blocked'];

    // Sample tasks specifically for managers
    const managerTasks = [
      {
        title: 'Update job descriptions',
        description: 'Review and update all job descriptions for accuracy',
        type: 'Administrative',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        priority: 'Low',
        status: 'Not Started',
        assignee: managers[0].id,
        creator: employer.id
      },
      {
        title: 'Schedule team performance reviews',
        description: 'Coordinate Q1 performance reviews for the development team',
        type: 'Performance Review',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        priority: 'Medium',
        status: 'Not Started',
        assignee: managers[0].id,
        creator: employer.id
      },
      {
        title: 'Review candidate applications',
        description: 'Review new applications for the Senior Developer position',
        type: 'Recruitment',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        priority: 'High',
        status: 'In Progress',
        assignee: managers[0].id,
        creator: employer.id
      }
    ];

    // Sample tasks specifically for employees
    const employeeTasks = [
      {
        title: 'Project status update',
        description: 'Prepare weekly project status update for team meeting',
        type: 'Administrative',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'Medium',
        status: 'Not Started',
        assignee: employees[0].id,
        creator: managers[0].id
      },
      {
        title: 'Prepare onboarding materials',
        description: 'Update onboarding materials for new hires starting next month',
        type: 'Onboarding',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
        priority: 'Medium',
        status: 'Not Started',
        assignee: employees[0].id,
        creator: managers[0].id
      },
      {
        title: 'Complete training modules',
        description: 'Finish the required compliance training modules',
        type: 'Training',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        priority: 'High',
        status: 'Not Started',
        assignee: employees[1].id,
        creator: managers[0].id
      }
    ];

    // Insert tasks for managers
    for (const task of managerTasks) {
      const taskId = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      await prisma.$executeRaw`
        INSERT INTO tasks (
          id, title, description, status, priority, type, due_date,
          created_at, updated_at, created_by, team_id, company_id
        ) VALUES (
          ${taskId},
          ${task.title},
          ${task.description},
          ${task.status},
          ${task.priority},
          ${task.type},
          ${task.dueDate},
          NOW(),
          NOW(),
          ${task.creator},
          ${managers[0].team_id},
          ${company.id}
        )
      `;

      const assigneeTaskId = Math.random().toString(36).substring(2, 15) + 
                            Math.random().toString(36).substring(2, 15);
      
      await prisma.$executeRaw`
        INSERT INTO task_assignees (
          id, task_id, user_id, assigned_at
        ) VALUES (
          ${assigneeTaskId},
          ${taskId},
          ${task.assignee},
          NOW()
        )
      `;
    }

    // Insert tasks for employees
    for (const task of employeeTasks) {
      const taskId = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
      
      await prisma.$executeRaw`
        INSERT INTO tasks (
          id, title, description, status, priority, type, due_date,
          created_at, updated_at, created_by, team_id, company_id
        ) VALUES (
          ${taskId},
          ${task.title},
          ${task.description},
          ${task.status},
          ${task.priority},
          ${task.type},
          ${task.dueDate},
          NOW(),
          NOW(),
          ${task.creator},
          ${managers[0].team_id},
          ${company.id}
        )
      `;

      const assigneeTaskId = Math.random().toString(36).substring(2, 15) + 
                            Math.random().toString(36).substring(2, 15);
      
      await prisma.$executeRaw`
        INSERT INTO task_assignees (
          id, task_id, user_id, assigned_at
        ) VALUES (
          ${assigneeTaskId},
          ${taskId},
          ${task.assignee},
          NOW()
        )
      `;
    }

    console.log(`Created ${managerTasks.length} tasks for managers and ${employeeTasks.length} tasks for employees`);

  } catch (error) {
    console.error('Error creating sample tasks:', error);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 
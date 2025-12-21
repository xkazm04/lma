const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/compliance/waivers/[wid]/route.ts',
  'src/app/api/compliance/predictions/route.ts',
  'src/app/api/compliance/calendar/export/route.ts',
  'src/app/api/compliance/calendar/reminders/route.ts',
];

const basePath = 'C:\\Users\\kazda\\kiro\\lma';

files.forEach(file => {
  const filePath = path.join(basePath, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add UserData interface after auth check for all GET, PUT, DELETE, POST, PATCH methods
  content = content.replace(
    /(\/\/ Get user's organization\s+const { data: userData } = await supabase\s+\.from\('users'\)\s+\.select\('organization_id'\)\s+\.eq\('id', user\.id\)\s+\.single\(\);)/g,
    `interface UserData {\n      organization_id: string;\n    }\n\n    $1 as { data: UserData | null };`
  );

  // Wrap activity logging in try/catch
  content = content.replace(
    /(\/\/ Log activity\s+await supabase\.from\('activities'\)\.insert\({[^}]+}\);)/gs,
    (match) => {
      return match.replace(
        /(\/\/ Log activity\s+)(await supabase\.from\('activities'\)\.insert\({[^}]+}\);)/s,
        '$1try {\n      await (supabase.from(\'activities\') as ReturnType<typeof supabase.from>).insert($2\n    } catch {\n      // Ignore activity logging errors\n    }'
      );
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All files fixed!');

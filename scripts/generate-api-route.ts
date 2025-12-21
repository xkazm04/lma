#!/usr/bin/env npx ts-node
/**
 * API Route Generator Script
 *
 * Generates new API route boilerplate following established patterns.
 * Enforces consistency across all API routes with proper auth checks,
 * validation, error handling, and typed responses.
 *
 * Usage:
 *   npx ts-node scripts/generate-api-route.ts --name <resource> [options]
 *
 * Examples:
 *   npx ts-node scripts/generate-api-route.ts --name invoices --methods GET,POST --supabase
 *   npx ts-node scripts/generate-api-route.ts --name predictions --methods POST --llm
 *   npx ts-node scripts/generate-api-route.ts --name reports/summary --methods GET --supabase --llm
 *
 * Options:
 *   --name, -n      Resource name (required). Use / for nested routes (e.g., deals/[id]/terms)
 *   --methods, -m   HTTP methods (default: GET,POST). Comma-separated: GET,POST,PUT,DELETE,PATCH
 *   --supabase, -s  Include Supabase database integration
 *   --llm, -l       Include LLM/Anthropic integration
 *   --auth, -a      Require authentication (default: true for POST/PUT/DELETE/PATCH)
 *   --dynamic, -d   Generate dynamic route with [id] parameter
 *   --help, -h      Show help
 */

import * as fs from 'fs';
import * as path from 'path';

interface GeneratorOptions {
  name: string;
  methods: string[];
  supabase: boolean;
  llm: boolean;
  auth: boolean;
  dynamic: boolean;
}

function parseArgs(): GeneratorOptions {
  const args = process.argv.slice(2);
  const options: GeneratorOptions = {
    name: '',
    methods: ['GET', 'POST'],
    supabase: false,
    llm: false,
    auth: true,
    dynamic: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--name':
      case '-n':
        options.name = nextArg || '';
        i++;
        break;
      case '--methods':
      case '-m':
        options.methods = (nextArg || 'GET,POST').toUpperCase().split(',');
        i++;
        break;
      case '--supabase':
      case '-s':
        options.supabase = true;
        break;
      case '--llm':
      case '-l':
        options.llm = true;
        break;
      case '--auth':
      case '-a':
        options.auth = true;
        break;
      case '--no-auth':
        options.auth = false;
        break;
      case '--dynamic':
      case '-d':
        options.dynamic = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
    }
  }

  if (!options.name) {
    console.error('Error: --name is required\n');
    showHelp();
    process.exit(1);
  }

  return options;
}

function showHelp(): void {
  console.log(`
API Route Generator

Generates new API route boilerplate following established LoanOS patterns.

Usage:
  npx ts-node scripts/generate-api-route.ts --name <resource> [options]

Options:
  --name, -n      Resource name (required). Use / for nested (e.g., deals/terms)
  --methods, -m   HTTP methods (default: GET,POST). Comma-separated.
  --supabase, -s  Include Supabase database integration
  --llm, -l       Include LLM/Anthropic integration
  --auth, -a      Require authentication (default: true)
  --no-auth       Disable authentication requirement
  --dynamic, -d   Generate dynamic route with [id] parameter
  --help, -h      Show this help

Examples:
  # Basic CRUD route with Supabase
  npx ts-node scripts/generate-api-route.ts -n invoices -m GET,POST,PUT,DELETE -s

  # LLM-powered analysis endpoint
  npx ts-node scripts/generate-api-route.ts -n analysis -m POST -l

  # Dynamic route with both Supabase and LLM
  npx ts-node scripts/generate-api-route.ts -n documents/[id]/analyze -m POST -s -l

  # Nested route structure
  npx ts-node scripts/generate-api-route.ts -n compliance/facilities -m GET,POST -s
`);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toPascalCase(str: string): string {
  return str
    .replace(/[[\]]/g, '')
    .split(/[-_/]/)
    .map(capitalize)
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSingular(str: string): string {
  // Simple pluralization rules
  if (str.endsWith('ies')) return str.slice(0, -3) + 'y';
  if (str.endsWith('es')) return str.slice(0, -2);
  if (str.endsWith('s')) return str.slice(0, -1);
  return str;
}

function generateImports(options: GeneratorOptions): string {
  const imports: string[] = [];

  // Core Next.js imports
  imports.push("import { NextRequest } from 'next/server';");

  // Supabase import
  if (options.supabase) {
    imports.push("import { createClient } from '@/lib/supabase/server';");
  }

  // LLM imports
  if (options.llm) {
    imports.push("import { generateStructuredOutput } from '@/lib/llm';");
  }

  // Response helpers - always include these for consistency
  imports.push(`import {
  respondSuccess,
  respondUnauthorized,
  respondValidationError,
  respondNotFound,
  respondDatabaseError,
  respondInternalError,
} from '@/lib/utils';`);

  // Type imports placeholder
  imports.push("// import type { YourType } from '@/types';");

  // Validation schema placeholder
  imports.push("// import { yourSchema } from '@/lib/validations';");

  return imports.join('\n');
}

function generateGetHandler(options: GeneratorOptions): string {
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const tableName = resourceName.toLowerCase().replace(/-/g, '_');

  let handler = '';

  if (options.dynamic) {
    handler = `
// GET /api/${options.name} - Get single ${toSingular(resourceName)}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;`;
  } else {
    handler = `
// GET /api/${options.name} - List all ${resourceName}
export async function GET(request: NextRequest) {
  try {`;
  }

  if (options.supabase) {
    if (options.dynamic) {
      handler += `
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('${tableName}')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return respondNotFound('${capitalize(toSingular(resourceName))} not found');
      }
      return respondDatabaseError(error.message);
    }

    return respondSuccess(data);`;
    } else {
      handler += `
    const supabase = await createClient();

    // Get query params for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let query = supabase
      .from('${tableName}')
      .select('*', { count: 'exact' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return respondDatabaseError(error.message);
    }

    return respondSuccess(data || [], {
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });`;
    }
  } else {
    handler += `
    // TODO: Implement ${options.dynamic ? 'fetch single' : 'list'} logic
    const data = {}; // Replace with actual data fetching

    return respondSuccess(data);`;
  }

  handler += `
  } catch {
    return respondInternalError();
  }
}`;

  return handler;
}

function generatePostHandler(options: GeneratorOptions): string {
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const tableName = resourceName.toLowerCase().replace(/-/g, '_');

  let handler = `
// POST /api/${options.name} - Create new ${toSingular(resourceName)}
export async function POST(request: NextRequest) {
  try {`;

  if (options.auth && options.supabase) {
    handler += `
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }`;
  } else if (options.supabase) {
    handler += `
    const supabase = await createClient();`;
  }

  handler += `

    const body = await request.json();

    // TODO: Add validation schema
    // const parsed = yourSchema.safeParse(body);
    // if (!parsed.success) {
    //   return respondValidationError('Invalid request', parsed.error.flatten());
    // }`;

  if (options.llm) {
    handler += `

    // LLM processing
    // const systemPrompt = 'You are an expert assistant...';
    // const userMessage = JSON.stringify(body);
    // const result = await generateStructuredOutput<YourResultType>(
    //   systemPrompt,
    //   userMessage
    // );`;
  }

  if (options.supabase) {
    handler += `

    // Create record
    const { data, error } = await supabase
      .from('${tableName}')
      .insert({
        // ...parsed.data,
        ...body,${options.auth ? '\n        created_by: user.id,' : ''}
      })
      .select()
      .single();

    if (error) {
      return respondDatabaseError(error.message);
    }

    return respondSuccess(data, { status: 201 });`;
  } else {
    handler += `

    // TODO: Implement create logic
    const data = { ...body };

    return respondSuccess(data, { status: 201 });`;
  }

  handler += `
  } catch {
    return respondInternalError();
  }
}`;

  return handler;
}

function generatePutHandler(options: GeneratorOptions): string {
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const tableName = resourceName.toLowerCase().replace(/-/g, '_');

  let handler = `
// PUT /api/${options.name} - Update ${toSingular(resourceName)}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;`;

  if (options.auth && options.supabase) {
    handler += `
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }`;
  } else if (options.supabase) {
    handler += `
    const supabase = await createClient();`;
  }

  handler += `

    const body = await request.json();

    // TODO: Add validation schema
    // const parsed = updateSchema.safeParse(body);
    // if (!parsed.success) {
    //   return respondValidationError('Invalid request', parsed.error.flatten());
    // }`;

  if (options.supabase) {
    handler += `

    const { data, error } = await supabase
      .from('${tableName}')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return respondNotFound('${capitalize(toSingular(resourceName))} not found');
      }
      return respondDatabaseError(error.message);
    }

    return respondSuccess(data);`;
  } else {
    handler += `

    // TODO: Implement update logic
    const data = { id, ...body };

    return respondSuccess(data);`;
  }

  handler += `
  } catch {
    return respondInternalError();
  }
}`;

  return handler;
}

function generatePatchHandler(options: GeneratorOptions): string {
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const tableName = resourceName.toLowerCase().replace(/-/g, '_');

  let handler = `
// PATCH /api/${options.name} - Partial update ${toSingular(resourceName)}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;`;

  if (options.auth && options.supabase) {
    handler += `
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }`;
  } else if (options.supabase) {
    handler += `
    const supabase = await createClient();`;
  }

  handler += `

    const body = await request.json();`;

  if (options.supabase) {
    handler += `

    const { data, error } = await supabase
      .from('${tableName}')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return respondNotFound('${capitalize(toSingular(resourceName))} not found');
      }
      return respondDatabaseError(error.message);
    }

    return respondSuccess(data);`;
  } else {
    handler += `

    // TODO: Implement partial update logic
    const data = { id, ...body };

    return respondSuccess(data);`;
  }

  handler += `
  } catch {
    return respondInternalError();
  }
}`;

  return handler;
}

function generateDeleteHandler(options: GeneratorOptions): string {
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const tableName = resourceName.toLowerCase().replace(/-/g, '_');

  let handler = `
// DELETE /api/${options.name} - Delete ${toSingular(resourceName)}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;`;

  if (options.auth && options.supabase) {
    handler += `
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respondUnauthorized();
    }`;
  } else if (options.supabase) {
    handler += `
    const supabase = await createClient();`;
  }

  if (options.supabase) {
    handler += `

    const { error } = await supabase
      .from('${tableName}')
      .delete()
      .eq('id', id);

    if (error) {
      return respondDatabaseError(error.message);
    }

    return respondSuccess({ deleted: true });`;
  } else {
    handler += `

    // TODO: Implement delete logic

    return respondSuccess({ deleted: true });`;
  }

  handler += `
  } catch {
    return respondInternalError();
  }
}`;

  return handler;
}

function generateRouteFile(options: GeneratorOptions): string {
  const handlers: string[] = [];

  // Generate handlers for each method
  for (const method of options.methods) {
    switch (method.toUpperCase()) {
      case 'GET':
        handlers.push(generateGetHandler(options));
        break;
      case 'POST':
        handlers.push(generatePostHandler(options));
        break;
      case 'PUT':
        handlers.push(generatePutHandler(options));
        break;
      case 'PATCH':
        handlers.push(generatePatchHandler(options));
        break;
      case 'DELETE':
        handlers.push(generateDeleteHandler(options));
        break;
    }
  }

  return `${generateImports(options)}
${handlers.join('\n')}
`;
}

function generateValidationSchema(options: GeneratorOptions): string {
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const schemaName = toCamelCase(toSingular(resourceName));

  return `import { z } from 'zod';

export const create${toPascalCase(toSingular(resourceName))}Schema = z.object({
  // TODO: Define your schema fields
  // name: z.string().min(1).max(255),
  // description: z.string().optional(),
});

export const update${toPascalCase(toSingular(resourceName))}Schema = create${toPascalCase(toSingular(resourceName))}Schema.partial();

export type Create${toPascalCase(toSingular(resourceName))}Input = z.infer<typeof create${toPascalCase(toSingular(resourceName))}Schema>;
export type Update${toPascalCase(toSingular(resourceName))}Input = z.infer<typeof update${toPascalCase(toSingular(resourceName))}Schema>;
`;
}

function main(): void {
  const options = parseArgs();

  // Determine route path
  let routePath = options.name;
  if (options.dynamic && !routePath.includes('[')) {
    // Add [id] segment if dynamic flag is set but no dynamic segment exists
    routePath = path.join(routePath, '[id]');
  }

  const routeDir = path.join(process.cwd(), 'src', 'app', 'api', routePath);
  const routeFile = path.join(routeDir, 'route.ts');

  // Check if route already exists
  if (fs.existsSync(routeFile)) {
    console.error(`Error: Route already exists at ${routeFile}`);
    console.error('Delete the existing route or choose a different name.');
    process.exit(1);
  }

  // Create directory
  fs.mkdirSync(routeDir, { recursive: true });

  // Generate route file
  const routeContent = generateRouteFile(options);
  fs.writeFileSync(routeFile, routeContent);
  console.log(`Created: ${routeFile}`);

  // Generate validation schema file
  const resourceName = path.basename(options.name).replace(/[[\]]/g, '');
  const validationDir = path.join(process.cwd(), 'src', 'lib', 'validations');
  const validationFile = path.join(validationDir, `${resourceName.toLowerCase()}.ts`);

  if (!fs.existsSync(validationFile)) {
    const validationContent = generateValidationSchema(options);
    fs.writeFileSync(validationFile, validationContent);
    console.log(`Created: ${validationFile}`);
  } else {
    console.log(`Skipped: ${validationFile} (already exists)`);
  }

  console.log('\nNext steps:');
  console.log('1. Update the validation schema with your fields');
  console.log('2. Import and use the schema in your route');
  console.log('3. Add proper types to @/types if needed');
  console.log('4. Run `npm run lint` to check for any issues');
}

main();

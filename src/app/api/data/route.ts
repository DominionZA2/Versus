import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const FILES: Record<string, string> = {
  comparisons: path.join(DATA_DIR, 'comparisons.json'),
  contenders: path.join(DATA_DIR, 'contenders.json'),
  aiConfig: path.join(DATA_DIR, 'ai-config.json'),
};

async function readJSON(filePath: string, fallback: unknown): Promise<unknown> {
  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJSON(filePath: string, data: unknown): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const [comparisons, contenders, aiConfig] = await Promise.all([
    readJSON(FILES.comparisons, []),
    readJSON(FILES.contenders, []),
    readJSON(FILES.aiConfig, null),
  ]);

  return NextResponse.json({ comparisons, contenders, aiConfig });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const writes: Promise<void>[] = [];

    for (const key of Object.keys(body)) {
      if (FILES[key]) {
        writes.push(writeJSON(FILES[key], body[key]));
      }
    }

    await Promise.all(writes);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

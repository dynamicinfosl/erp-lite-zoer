import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = execSync('git status', { encoding: 'utf8' });
    const log = execSync('git log -n 10 --oneline', { encoding: 'utf8' });
    const remote = execSync('git remote -v', { encoding: 'utf8' });
    const fetchStatus = execSync('git fetch origin && git status -uno', { encoding: 'utf8' });
    
    return NextResponse.json({
      success: true,
      status,
      log,
      remote,
      fetchStatus
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stderr: error.stderr?.toString(),
      stdout: error.stdout?.toString()
    });
  }
}

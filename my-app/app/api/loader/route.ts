import { NextRequest, NextResponse } from 'next/server';

// This will be the API endpoint for controlling the front loader
// Future implementation will allow programmatic control

interface LoaderCommand {
  action: 'move' | 'lift' | 'lower' | 'status';
  direction?: 'up' | 'down' | 'left' | 'right';
  steps?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoaderCommand = await request.json();

    // Validate the command
    if (!body.action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Future: Implement actual control logic here
    // For now, just return a success response
    const response = {
      success: true,
      message: `Command '${body.action}' received`,
      timestamp: new Date().toISOString(),
      command: body,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

export async function GET() {
  // Get current loader status
  const status = {
    position: { x: 0, y: 0 },
    direction: 'right',
    forkLifted: false,
    status: 'ready',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(status);
}

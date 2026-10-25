import { NextRequest, NextResponse } from 'next/server';
import { getContent, saveContent } from '@/lib/contentStore';
import { SiteContent } from '@/types/content';

const SESSION_SECRET = 'aether-love-secret-token-2026';

export async function GET() {
  try {
    const content = getContent();
    // Do not leak password hash to public endpoint
    const sanitized = {
      ...content,
      general: {
        ...content.general,
        adminPasswordHash: undefined,
      },
    };
    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('aether_admin_token')?.value;
    if (token !== SESSION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized to save changes' }, { status: 401 });
    }

    const updatedData: SiteContent = await req.json();
    const existing = getContent();
    
    // Preserve password hash if not explicitly set
    if (!updatedData.general.adminPasswordHash) {
      updatedData.general.adminPasswordHash = existing.general.adminPasswordHash;
    }

    const success = saveContent(updatedData);
    if (!success) {
      return NextResponse.json({ error: 'Failed to save to disk' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Content saved successfully', data: updatedData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}

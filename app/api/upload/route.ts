import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Handle Excel file upload using formidable, parse it, and return webinar data as JSON
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with expected headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Process the data - assuming first row is headers
    const headers = jsonData[0] as string[];
    const webinars = (jsonData.slice(1) as any[][])
      .filter((row: any[]) => {
        // Filter out empty rows - check if at least one cell has meaningful data
        return row && row.some(cell => 
          cell !== null && 
          cell !== undefined && 
          String(cell).trim() !== ''
        );
      })
      .map((row: any[], index) => {
        const webinar: any = { id: index + 1 };
        headers.forEach((header, i) => {
          // Clean up the data and handle empty cells
          const cellValue = row[i];
          webinar[header.toLowerCase().replace(/\s+/g, '_')] = 
            cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';
        });
        return webinar;
      });

    return NextResponse.json({ 
      success: true, 
      webinars,
      message: `Parsed ${webinars.length} webinars successfully`
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' }, 
      { status: 500 }
    );
  }
}

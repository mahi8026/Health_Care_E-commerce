/**
 * Unit tests for pdfExporter utility
 * Requirements: 3.4, 3.5
 */

// Mock jspdf and jspdf-autotable so tests run in Node without a DOM/canvas.
const mockSave = jest.fn();
const mockText = jest.fn();
const mockSetFontSize = jest.fn();
const mockSetFont = jest.fn();
const mockAutoTable = jest.fn();

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    save: mockSave,
    text: mockText,
    setFontSize: mockSetFontSize,
    setFont: mockSetFont,
    autoTable: mockAutoTable,
  })),
}));

// jspdf-autotable patches jsPDF.prototype; we just need the import to resolve.
jest.mock('jspdf-autotable', () => ({}));

const { exportTableToPDF, exportOrdersToPDF, exportReportToPDF } = require('../pdfExporter');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('exportTableToPDF', () => {
  it('creates a PDF document and saves it with the given filename', async () => {
    await exportTableToPDF({
      title: 'Test Report',
      columns: ['Col A', 'Col B'],
      rows: [['val1', 'val2']],
      filename: 'test-output',
    });

    const { jsPDF } = require('jspdf');
    expect(jsPDF).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith('test-output.pdf');
  });

  it('uses the default filename "export" when none is provided', async () => {
    await exportTableToPDF({
      title: 'No Filename',
      columns: ['A'],
      rows: [],
    });

    expect(mockSave).toHaveBeenCalledWith('export.pdf');
  });

  it('sets the document title text', async () => {
    await exportTableToPDF({
      title: 'My Title',
      columns: [],
      rows: [],
    });

    expect(mockText).toHaveBeenCalledWith('My Title', expect.any(Number), expect.any(Number));
  });

  it('calls autoTable with the provided columns and rows', async () => {
    const columns = ['Name', 'Value'];
    const rows = [['Alpha', '100'], ['Beta', '200']];

    await exportTableToPDF({ title: 'T', columns, rows });

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        head: [columns],
        body: rows,
      })
    );
  });
});

describe('exportOrdersToPDF', () => {
  it('generates a PDF without throwing when given an empty orders array', async () => {
    await expect(exportOrdersToPDF([])).resolves.toBeUndefined();
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('maps order fields to table rows correctly', async () => {
    const orders = [
      {
        _id: 'ORD-001',
        customerName: 'United Hospital',
        createdAt: '2024-01-15T10:00:00Z',
        itemCount: 3,
        total: 15000,
        status: 'Delivered',
      },
    ];

    await exportOrdersToPDF(orders);

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.arrayContaining([
          expect.arrayContaining(['ORD-001', 'United Hospital', 'Delivered']),
        ]),
      })
    );
  });

  it('handles missing order fields gracefully with em-dash placeholders', async () => {
    await exportOrdersToPDF([{}]);

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.arrayContaining([
          expect.arrayContaining(['—']),
        ]),
      })
    );
  });
});

describe('exportReportToPDF', () => {
  it('generates a PDF without throwing when given empty report data', async () => {
    await expect(exportReportToPDF({})).resolves.toBeUndefined();
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('includes top products in the table rows', async () => {
    const reportData = {
      topProducts: [{ name: 'ECG Machine', revenue: 4275000 }],
      topCustomers: [],
    };

    await exportReportToPDF(reportData);

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.arrayContaining([
          expect.arrayContaining(['ECG Machine', 'Revenue']),
        ]),
      })
    );
  });

  it('includes top customers in the table rows', async () => {
    const reportData = {
      topProducts: [],
      topCustomers: [{ name: 'Square Hospital', spent: 2450000 }],
    };

    await exportReportToPDF(reportData);

    expect(mockAutoTable).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.arrayContaining([
          expect.arrayContaining(['Square Hospital', 'Spent']),
        ]),
      })
    );
  });
});

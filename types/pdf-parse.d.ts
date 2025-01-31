declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: unknown;
    };
  }

  const pdfParse: (dataBuffer: Buffer) => Promise<PDFData>;
  export = pdfParse;
} 
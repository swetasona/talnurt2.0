declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  function parse(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  
  export default parse;
} 
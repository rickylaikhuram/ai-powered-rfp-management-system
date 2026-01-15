import { PDFParse } from "pdf-parse";

const pdfParser = async (dataBuffer: Buffer) => {
  const uint8Array = new Uint8Array(dataBuffer);

  const parser = new PDFParse(uint8Array);
  const result = await parser.getText();
  return result;
};
export default pdfParser;

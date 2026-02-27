declare module "pizzip" {
  class PizZip {
    constructor(data?: string | ArrayBuffer | Buffer, options?: { base64?: boolean });
    file(name: string, content?: string | Buffer | ArrayBuffer | null, options?: object): this | PizZip.ZipObject | null;
    generate(options?: { type?: string; compression?: string; [key: string]: unknown }): Buffer;
  }
  namespace PizZip {
    interface ZipObject {
      name: string;
      asText(): string;
      asBinary(): string;
      asArrayBuffer(): ArrayBuffer;
      asNodeBuffer(): Buffer;
    }
  }
  export = PizZip;
}

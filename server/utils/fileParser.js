const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class FileParser {
  async parseResume(file) {
    try {
      const { buffer, mimetype, originalname } = file;
      
      let text = '';
      
      if (mimetype === 'application/pdf') {
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (mimetype === 'text/plain') {
        text = buffer.toString('utf-8');
      } else {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, or TXT files.');
      }
      
      // Clean up the text
      text = this.cleanText(text);
      
      return {
        text,
        filename: originalname,
        fileType: mimetype
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error('Failed to parse resume file');
    }
  }

  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  extractContactInfo(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    
    const emails = text.match(emailRegex) || [];
    const phones = text.match(phoneRegex) || [];
    
    return {
      email: emails[0] || null,
      phone: phones[0] || null
    };
  }
}

module.exports = new FileParser();
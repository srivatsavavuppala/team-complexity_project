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

      // Compute experience years
      const experienceYears = this.extractExperienceYears(text);
      
      return {
        text,
        filename: originalname,
        fileType: mimetype,
        experienceYears
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
  extractExperienceYears(text, now = new Date()) {
    if (!text || typeof text !== 'string') return 0;

    const normalized = text.replace(/—|–|−/g, '-').replace(/\u00A0/g, ' ');

    const rangeRegex = /([A-Za-z]{3,9}\s*\d{4}|\d{1,2}[\/\-]\d{4}|\d{4}|Present|present|Now)\s*[-–—]\s*([A-Za-z]{3,9}\s*\d{4}|\d{1,2}[\/\-]\d{4}|\d{4}|Present|present|Now)/g;

    const monthMap = {
      jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
    };

    function parseDateToken(token) {
      if (!token) return null;
      token = token.trim().replace(/[(),]/g,'');
      if (/present|now/i.test(token)) return new Date(now);
      const m1 = token.match(/([A-Za-z]+)\s+(\d{4})/);
      if (m1) {
        const month = monthMap[m1[1].slice(0,3).toLowerCase()] ?? 0;
        const year = parseInt(m1[2],10);
        return new Date(year, month,1);
      }
      const m2 = token.match(/(\d{1,2})[\/\-](\d{4})/);
      if (m2) return new Date(parseInt(m2[2],10), parseInt(m2[1],10)-1,1);
      const m3 = token.match(/(\d{4})/);
      if (m3) return new Date(parseInt(m3[1],10),0,1);
      return null;
    }

    let match, periods = [];
    while ((match = rangeRegex.exec(normalized)) !== null) {
      const start = parseDateToken(match[1]);
      const end = parseDateToken(match[2]);
      if (start && end && start <= end) periods.push({start,end});
    }

    if (periods.length === 0) return 0;
    periods.sort((a,b)=>a.start-b.start);
    const merged = [];
    for (const p of periods) {
      if (!merged.length) merged.push(p);
      else {
        const last = merged[merged.length-1];
        if (p.start <= last.end) last.end = p.end>last.end?p.end:last.end;
        else merged.push(p);
      }
    }
    let totalMonths = 0;
    for (const p of merged) {
      const months = (p.end.getFullYear()-p.start.getFullYear())*12 + (p.end.getMonth()-p.start.getMonth());
      totalMonths += Math.max(0, months);
    }

    return +(totalMonths/12).toFixed(2);
  }
}

module.exports = new FileParser();

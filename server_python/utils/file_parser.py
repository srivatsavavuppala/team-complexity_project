"""
File parsing utilities for resume and document processing
"""

import os
import io
import tempfile
from typing import Optional, Tuple
from fastapi import UploadFile, HTTPException
import PyPDF2
from docx import Document
import magic

# Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "pdf,doc,docx,txt").split(",")

class FileParser:
    """Utility class for parsing various file formats"""
    
    @staticmethod
    def validate_file(file: UploadFile) -> Tuple[bool, str]:
        """Validate uploaded file"""
        
        # Check file size
        if file.size > MAX_FILE_SIZE:
            return False, f"File size exceeds maximum allowed size of {MAX_FILE_SIZE} bytes"
        
        # Check file extension
        file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if file_extension not in ALLOWED_EXTENSIONS:
            return False, f"File type '{file_extension}' not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        
        return True, "File is valid"
    
    @staticmethod
    async def extract_text_from_file(file: UploadFile) -> str:
        """Extract text from uploaded file"""
        
        # Validate file first
        is_valid, message = FileParser.validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Read file content
        content = await file.read()
        
        # Reset file pointer for potential re-reading
        await file.seek(0)
        
        # Determine file type using python-magic
        mime_type = magic.from_buffer(content, mime=True)
        
        try:
            if mime_type == "application/pdf":
                return FileParser._extract_text_from_pdf(content)
            elif mime_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                              "application/msword"]:
                return FileParser._extract_text_from_docx(content)
            elif mime_type.startswith("text/"):
                return FileParser._extract_text_from_txt(content)
            else:
                # Fallback: try to determine by file extension
                file_extension = file.filename.split(".")[-1].lower() if "." in file.filename else ""
                
                if file_extension == "pdf":
                    return FileParser._extract_text_from_pdf(content)
                elif file_extension in ["docx", "doc"]:
                    return FileParser._extract_text_from_docx(content)
                elif file_extension == "txt":
                    return FileParser._extract_text_from_txt(content)
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Unsupported file type: {mime_type}"
                    )
                    
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Error extracting text from file: {str(e)}"
            )
    
    @staticmethod
    def _extract_text_from_pdf(content: bytes) -> str:
        """Extract text from PDF file"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
            
        except Exception as e:
            raise Exception(f"Error reading PDF file: {str(e)}")
    
    @staticmethod
    def _extract_text_from_docx(content: bytes) -> str:
        """Extract text from DOCX file"""
        try:
            # Create a temporary file to work with python-docx
            with tempfile.NamedTemporaryFile(delete=False, suffix=".docx") as tmp_file:
                tmp_file.write(content)
                tmp_file_path = tmp_file.name
            
            try:
                doc = Document(tmp_file_path)
                text = ""
                
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                
                return text.strip()
                
            finally:
                # Clean up temporary file
                os.unlink(tmp_file_path)
                
        except Exception as e:
            raise Exception(f"Error reading DOCX file: {str(e)}")
    
    @staticmethod
    def _extract_text_from_txt(content: bytes) -> str:
        """Extract text from TXT file"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
            
            for encoding in encodings:
                try:
                    return content.decode(encoding).strip()
                except UnicodeDecodeError:
                    continue
            
            # If all encodings fail, use utf-8 with error handling
            return content.decode('utf-8', errors='replace').strip()
            
        except Exception as e:
            raise Exception(f"Error reading text file: {str(e)}")
    
    @staticmethod
    def clean_extracted_text(text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters that might cause issues
        text = re.sub(r'[^\w\s\-.,;:()@#$%&*+=<>?/\\|`~!]', '', text)
        
        # Trim and return
        return text.strip()
    
    @staticmethod
    def get_file_info(file: UploadFile) -> dict:
        """Get information about uploaded file"""
        return {
            "filename": file.filename,
            "content_type": file.content_type,
            "size": file.size,
            "extension": file.filename.split(".")[-1].lower() if "." in file.filename else ""
        }

# Create a singleton instance
file_parser = FileParser()
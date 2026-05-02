import fitz  # PyMuPDF
import io

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract text from a PDF file provided as bytes."""
    text = ""
    try:
        # Open the PDF from memory
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text += page.get_text("text") + "\n"
        pdf_document.close()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        # Could raise a specific exception or return partial text
        
    return text.strip()

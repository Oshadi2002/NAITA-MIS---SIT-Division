from django.template.loader import render_to_string
from django.conf import settings
from io import BytesIO
import datetime
import os

def generate_placement_letter(student, file_path=None):
    """
    Generate a professional placement letter PDF for a student
    If file_path is provided, save to file, otherwise return PDF content
    """
    try:
        from xhtml2pdf import pisa
    except ImportError as e:
        raise ImportError(f"xhtml2pdf dependencies not available: {e}. ")
    
    html_string = render_to_string(
        "placement_letter.html",
        {
            "student": student,
            "today": datetime.date.today().strftime("%B %d, %Y")
        }
    )
    
    # Generate PDF
    if file_path:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'wb') as pdf_file:
            pisa_status = pisa.CreatePDF(html_string, dest=pdf_file)
            if pisa_status.err:
                raise Exception("Error generating PDF via xhtml2pdf")
        return file_path
    else:
        pdf_buffer = BytesIO()
        pisa_status = pisa.CreatePDF(html_string, dest=pdf_buffer)
        if pisa_status.err:
            raise Exception("Error generating PDF via xhtml2pdf")
        return pdf_buffer.getvalue()
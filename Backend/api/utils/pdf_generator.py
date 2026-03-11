from django.template.loader import render_to_string
from django.conf import settings
from io import BytesIO
import datetime
import os

def generate_placement_letter(student, file_path=None):
    """
    Generate a professional placement letter PDF for a student
    """
    context = {
        "student": student,
        "today": datetime.date.today().strftime("%B %d, %Y")
    }
    return _generate_pdf_from_template("placement_letter.html", context, file_path)

def edit_agreement_pdf(student, signature_image_path, additional_text, date, file_path=None):
    """
    Edits the uploaded agreement form PDF to insert date, student reg number, and stamp/seal.
    """
    if not student.agreement_form:
        raise Exception("Student has not uploaded an agreement form.")

    from io import BytesIO
    from reportlab.pdfgen import canvas
    from pypdf import PdfReader, PdfWriter
    import os
    import tempfile

    original_file_path = student.agreement_form.path
    original_pdf_path = original_file_path
    cleanup_temp_pdf = False
    
    ext = os.path.splitext(original_file_path)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png']:
        import img2pdf
        temp_pdf_fd, temp_pdf_path = tempfile.mkstemp(suffix='.pdf')
        with open(temp_pdf_fd, 'wb') as f:
            f.write(img2pdf.convert(original_file_path))
        original_pdf_path = temp_pdf_path
        cleanup_temp_pdf = True

    try:
        original_pdf = PdfReader(original_pdf_path)
        
        num_pages = len(original_pdf.pages)
        if num_pages == 0:
            raise Exception("Uploaded agreement form has no pages.")
            
        target_page = original_pdf.pages[-1]
        page_width = float(target_page.mediabox.width)
        page_height = float(target_page.mediabox.height)
        
        packet = BytesIO()
        c = canvas.Canvas(packet, pagesize=(page_width, page_height))
        
        # Top right corner placements
        x_pos = page_width - 200
        
        # Registration No above the seal
        reg_no_str = student.admin_reg_number if student.admin_reg_number else "N/A"
        c.drawString(x_pos, page_height - 60, f"Registration No: {reg_no_str}")
        
        # Seal / Stamp
        if signature_image_path and os.path.exists(signature_image_path):
            c.drawImage(signature_image_path, x_pos, page_height - 160, width=150, height=80, mask='auto', preserveAspectRatio=True)
            
        # Date below the seal
        c.drawString(x_pos, page_height - 180, f"Date: {date}")
        
        # Additional remarks optionally printed below the date
        if additional_text:
            c.drawString(x_pos, page_height - 200, f"Remarks: {additional_text}")
            
        c.save()
        packet.seek(0)
        
        overlay_pdf = PdfReader(packet)
        overlay_page = overlay_pdf.pages[0]
        
        writer = PdfWriter()
        
        for i in range(num_pages):
            page = original_pdf.pages[i]
            # Merge on the last page where signatures usually go
            if i == num_pages - 1:
                page.merge_page(overlay_page)
            writer.add_page(page)
            
        if file_path:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, 'wb') as f:
                writer.write(f)
            return file_path
        else:
            output = BytesIO()
            writer.write(output)
            return output.getvalue()
    finally:
        if cleanup_temp_pdf and os.path.exists(original_pdf_path):
            try:
                os.remove(original_pdf_path)
            except:
                pass

def _generate_pdf_from_template(template_name, context, file_path=None):
    """
    Helper to generate PDF from any template
    """
    try:
        from xhtml2pdf import pisa
    except ImportError as e:
        raise ImportError(f"xhtml2pdf dependencies not available: {e}. ")
    
    html_string = render_to_string(template_name, context)
    
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
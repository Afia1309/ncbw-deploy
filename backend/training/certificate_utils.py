import io
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

def generate_certificate_pdf(user_name, member_id, track_name, completion_date, certificate_code):
    buffer = io.BytesIO()

    c = canvas.Canvas(buffer, pagesize=landscape(letter))
    width, height = landscape(letter)

    c.setStrokeColor(HexColor('#D4AF37'))
    c.setLineWidth(5)
    c.rect(30, 30, width - 60, height - 60)

    c.setStrokeColor(HexColor('#D4AF37'))
    c.setLineWidth(1.5)
    c.rect(35, 35, width - 70, height - 70)

    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(HexColor('#2C3E50'))
    c.drawCentredString(width / 2, height - 100, "CERTIFICATE OF COMPLETION")

    c.setFont("Helvetica", 14)
    c.setFillColor(HexColor('#7F8C8D'))
    c.drawCentredString(width / 2, height - 130, "This certificate is proudly presented to")

    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(HexColor('#D4AF37'))
    c.drawCentredString(width / 2, height - 190, user_name)

    c.setFont("Helvetica", 12)
    c.setFillColor(HexColor('#2C3E50'))
    c.drawCentredString(width / 2, height - 240, "for successfully completing the")

    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(HexColor('#2980B9'))
    c.drawCentredString(width / 2, height - 280, track_name)
    
    c.setFont("Helvetica", 11)
    c.setFillColor(HexColor('#7F8C8D'))
    c.drawCentredString(width / 2, height - 340, f"Date of Completion: {completion_date}")
    
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor('#95A5A6'))
    c.drawCentredString(width / 2, height - 370, f"Certificate ID: {certificate_code}")
    
    c.setFont("Helvetica", 9)
    c.drawCentredString(width / 2, height - 385, f"Member ID: {member_id}")
    
    c.setStrokeColor(HexColor('#D4AF37'))
    c.setLineWidth(1)
    c.line(width / 2 - 150, height - 420, width / 2 + 150, height - 420)

    c.save()
    
    buffer.seek(0)
    return buffer
from fpdf import FPDF
import os

def text_to_pdf(input_file, output_file):
    # Create a PDF object
    pdf = FPDF()
    # Add a page
    pdf.add_page()
    # Set font
    pdf.set_font("Arial", size=10)
    
    # Open and read the text file
    with open(input_file, 'r') as file:
        for line in file:
            # Encode the line to avoid character issues
            encoded_line = line.encode('latin-1', 'replace').decode('latin-1')
            # Add the line to the PDF
            pdf.cell(0, 5, txt=encoded_line, ln=1)
    
    # Save the PDF
    pdf.output(output_file)
    print(f"Created PDF file: {output_file}")

if __name__ == "__main__":
    input_file = "python/test_resume.txt"
    output_file = "python/test_resume.pdf"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found.")
        exit(1)
    
    # Create the PDF
    text_to_pdf(input_file, output_file) 
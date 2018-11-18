# Generate-Responsive-Resume-HTML-PDF

This CLI will help you generate your resume in HTML (responsive) and PDF.

### How to use this library

1. Install the library using `npm` as follows:
  ```
  npm install -g html-pdf-resume
  ```
2. Write your information in XML format and save it in some file, e.g. `resume.xml`. The schema to be used will be explained below.

3. Execute the following command: 
  ```
  html-resume <path-to-JSON-file>/resume.xml
  ```
4. Your resume in HTML format will be generated in your current directory.
5. To get PDF format, 

The library uses templates written in Pug (erstwhile Jade) format.

# Generate-Resume

This CLI will help you generate your resume in HTML and PDF.

### How to use this library

1. Install the library using `npm` as follows:
  ```
  npm install -g generate-resume
  ```
2. Write your information in XML format and save it in some file, e.g. `resume.xml`. The schema can be found in [bin/reference-xml/resume.xml](bin/reference-xml/resume.xml).

3. Execute the following command: 
  ```
  generate-resume <path-to-XML-file>/resume.xml
  ```
4. Your resume in HTML and PDF format will be generated in your current directory.

The library uses templates written in Pug (erstwhile Jade) format.

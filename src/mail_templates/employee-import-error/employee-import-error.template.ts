export const EmployeeImportErrorEmailTemplate = (data: any) => {
  let error_list = ""
  for(let error of data.error_data){
    error_list = `${error_list}<li>รหัสประจำตัวประชาชน ${error.username}: ${error.messages.join(', ')}</li>`
  }
  return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title></title>
        <style type="text/css">
          body {
            font-family: Arial;
          }
        </style>
    </head>
    <body>
      Data Import Error at: ${data.date_time}
      <ul>
          ${error_list}
      </ul>
    </body>
  </html>
  `
}
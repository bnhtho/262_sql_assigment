SELECT 
    supplier_id,
    supplier_name,
    tax_code,
    contact_person,
    phone,
    email,
    address
FROM dbo.supplier
ORDER BY supplier_id ASC;
GO
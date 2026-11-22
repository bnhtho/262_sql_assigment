SELECT 
    customer_id,
    member_code,
    ho,
    ten,
    full_name,
    phone,
    email,
    address
FROM dbo.customer
ORDER BY customer_id ASC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;
GO
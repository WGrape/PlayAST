
-- 测试SQL

SELECT ProductID, Total = SUM(LineTotal)
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING SUM(LineTotal) > $2000000.00 ;

---------------替换为下面这种---------------

SELECT ProductID , SUM( LineTotal ) AS Total
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING SUM( LineTotal ) > $2000000.00 ;




SELECT ProductID, AVG(OrderQty) AS AverageQuantity, SUM(LineTotal) AS Total
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING SUM(LineTotal) > $1000000.00
AND AVG(OrderQty) < 3 ;

SELECT ProductID, SUM(LineTotal) AS Total
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING COUNT(*) > 1500 ;


SELECT ProductID
FROM Sales.SalesOrderDetail
GROUP BY ProductID
HAVING AVG(OrderQty) > 5
ORDER BY ProductID ;

select * from(
SELECT pm.Name, AVG(ListPrice) AS 'Average List Price'
FROM Production.Product AS p
JOIN Production.ProductModel AS pm
ON p.ProductModelID = pm.ProductModelID
GROUP BY pm.Name
HAVING pm.Name LIKE 'Mountain%'
ORDER BY pm.Name ;
)


SELECT pm.Name, AVG(ListPrice) AS 'Average List Price'
FROM Production.Product AS p
JOIN Production.ProductModel AS pm
ON p.ProductModelID = pm.ProductModelID
GROUP BY pm.Name
HAVING pm.Name LIKE 'Mountain%'
ORDER BY pm.Name ;


select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3 ;

select *, count(*) from (
  select productid , avg( orderqty ) as averagequantity , sum( linetotal ) as total from sales.salesorderdetail group by productid having sum( linetotal ) > $1000000.00 and avg( orderqty ) < 3
)
